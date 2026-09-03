import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {run,command,usage,estimate,redact,decode,preflight} from './agents.mjs';
const fixtures={
 codex:[{type:'thread.started',thread_id:'t'},{type:'item.completed',item:{type:'agent_message',text:'OK'}},{type:'turn.completed',usage:{input_tokens:12,output_tokens:2}}],
 cursor:[{type:'result',result:'OK',is_error:false,session_id:'t',usage:{inputTokens:12,outputTokens:2}}],
 antigravity:[{status:'SUCCESS',response:'OK',conversation_id:'t',usage:{input_tokens:12,output_tokens:2}}],
 muse:[{payload_type:'run.model.configured',payload:{model_id:'test-model'}},{payload_type:'run.output.delta',payload:{text:'O'}},{payload_type:'run.terminal.completed',payload:{text:'OK'}}]
};
async function fake(t,cli,events,options={}){
 const dir=mkdtempSync(join(tmpdir(),'agent-adapter-test-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const bin=join(dir,'cli');writeFileSync(bin,'#!/usr/bin/env node\nif(process.argv.includes("--version")){console.log("fixture-1");process.exit(0);}\n'+(options.code || `console.log(${JSON.stringify(events.map(e=>JSON.stringify(e)).join('\n'))});`),{mode:0o700});
 const result=await run({cli,model:'test-model',binary:bin,logDir:join(dir,'logs'),cwd:dir,...options.config},'PRIVATE_PROMPT');
 return {result,dir};
}
for(const [cli,events]of Object.entries(fixtures))test(`${cli}: normalize result and keep default artifacts content-free`,async t=>{
 const {result}=await fake(t,cli,events);assert.equal(result.status,'success');assert.equal(result.output,'OK');assert.equal(result.observedModel,null);assert.equal(result.cliVersion,'fixture-1');assert.equal(result.cost.estimated.amount,null);assert.equal(result.latency.ttftMs,null);
 const saved=readFileSync(join(result.logDir,'result.json'),'utf8');assert.equal(JSON.parse(saved).output,undefined);assert.ok(!readFileSync(join(result.logDir,'trace.jsonl'),'utf8').includes('PRIVATE_PROMPT'));
});
test('billing halts a retrying provider and logs an error result',async t=>{
 const event={payload_type:'task.lifecycle.status',payload:{event:{details:{facets:[{kind:'external_attempt',attempt:1,http_status:402}]}}}};
 const {result}=await fake(t,'muse',[],{code:`console.log(${JSON.stringify(JSON.stringify(event))});setInterval(()=>{},1000);`});assert.equal(result.error.category,'billing');assert.ok(result.latency.processMs<3000);
});
test('timeout yields a durable failed attempt',async t=>{const {result}=await fake(t,'cursor',[],{code:'setInterval(()=>{},1000);',config:{timeoutSeconds:0.05}});assert.equal(result.error.category,'timeout');assert.equal(JSON.parse(readFileSync(join(result.logDir,'result.json'))).status,'error');});
test('mismatch rejected, missing usage remains unknown',async t=>{const {result}=await fake(t,'cursor',[{type:'result',result:'OK',model:'other'}]);assert.equal(result.error.category,'model_mismatch');assert.equal(result.usage.inputTokens,null);});
test('malformed output fails rather than accepting successful process exit',async t=>{const {result}=await fake(t,'cursor',[],{code:'console.log("not-json")'});assert.equal(result.error.category,'invalid_output');assert.equal(result.parseErrors,1);});
test('opt-in trace captures content and redacts credential fields',async t=>{const {result}=await fake(t,'cursor',[{type:'result',result:'OK',access_token:'SECRET'}],{config:{captureContent:true}});const trace=readFileSync(join(result.logDir,'trace.jsonl'),'utf8');assert.ok(trace.includes('PRIVATE_PROMPT'));assert.ok(!trace.includes('SECRET'));});
test('cost estimates require provenance and missing counts do not become zero',()=>{assert.throws(()=>estimate(usage(null),{}));const p={source:'supplied price sheet',asOf:'2026-09-03',currency:'USD',tokenFields:{inputTokens:2,outputTokens:4}};assert.equal(estimate(usage(null),p).amount,null);assert.equal(estimate(usage({input_tokens:1000000,output_tokens:1000000}),p).amount,6);});
test('command does not allow ambiguous cursor reasoning or shell execution',()=>{assert.throws(()=>command({cli:'cursor',model:'m',reasoning:'high'},'p'));assert.ok(command({cli:'muse',model:'m'},'p').args.includes('--disable-shell'));assert.equal(redact({api_key:'secret'}).api_key,'[REDACTED]');});
test('Cursor stream skips duplicate flushes and treats init model as a display label',async t=>{
 const events=[{type:'system',subtype:'init',model:'Test Model Display'},
 {type:'assistant',timestamp_ms:1,message:{content:[{type:'text',text:'OK'}]}},
 {type:'assistant',timestamp_ms:2,model_call_id:'call',message:{content:[{type:'text',text:'OK'}]}},
 {type:'assistant',message:{content:[{type:'text',text:'OK'}]}},
 {type:'result',result:'OK'}];
 const {result}=await fake(t,'cursor',events);assert.equal(result.status,'success');assert.equal(result.streamDeltaCount,1);assert.equal(result.configuredModel,'Test Model Display');assert.equal(result.observedModel,null);
});
test('Antigravity stream keeps latest step state and terminal aggregate without double counting',async t=>{
 const events=[{event:'init',init:{model:'test-model',tools:['read'],permission_mode:'request-review'}},
 {event:'step_update',step_update:{step_index:1,step_type:'agent_response',state:'ACTIVE',text_delta:'O'}},
 {event:'step_update',step_update:{step_index:1,step_type:'agent_response',state:'DONE',text_delta:'K',duration_seconds:0.2,usage:{input_tokens:10,output_tokens:2}}},
 {event:'result',result:{status:'SUCCESS',response:'OK',usage:{input_tokens:10,output_tokens:2}}}];
 const {result}=await fake(t,'antigravity',events);assert.equal(result.output,'OK');assert.equal(result.usage.inputTokens,10);assert.equal(result.steps[1].durationMs,200);assert.equal(result.availableTools[0],'read');
});
test('local persistence requires an explicit option',()=>{
 assert.ok(command({cli:'codex',model:'m'},'p').args.includes('--ephemeral'));
 assert.ok(!command({cli:'codex',model:'m',retainLocalSession:true},'p').args.includes('--ephemeral'));
 assert.ok(!command({cli:'muse',model:'m',retainLocalSession:true},'p').args.includes('--no-session-log'));
});

test('Devin export supplies observed model and aggregate usage without retaining content',async t=>{
 const native={session_id:'session',agent:{extra:{permission_mode:'Autonomous'}},steps:[{step_id:1,source:'agent',message:'PRIVATE_NATIVE',extra:{generation_model:'test-model'},metrics:{prompt_tokens:12}}],final_metrics:{total_prompt_tokens:12,total_completion_tokens:2,total_cached_tokens:4,total_steps:1}};
 const {result}=await fake(t,'devin',[],{code:`const fs=require('fs');fs.writeFileSync(process.argv[process.argv.indexOf('--export')+1],${JSON.stringify(JSON.stringify(native))});console.log('OK');`});
 assert.equal(result.status,'success');assert.equal(result.observedModel,'test-model');assert.equal(result.usage.cacheReadTokens,4);assert.equal(result.latency.firstAnswerEventMs,null);assert.ok(!readdirSync(result.logDir).includes('native-export.json'));assert.ok(!readFileSync(join(result.logDir,'trace.jsonl'),'utf8').includes('PRIVATE_NATIVE'));
});
test('Devin cannot silently succeed without native model evidence export',async t=>{
 const {result}=await fake(t,'devin',[],{code:"console.log('OK')"});assert.equal(result.error.category,'invalid_export');
});
test('ZCode requires both configured roles to match and decodes final response',()=>{
 const dir=mkdtempSync(join(tmpdir(),'zcode-config-'));try{
 const path=join(dir,'settings.json');writeFileSync(path,JSON.stringify({model:{main:'zai/test',lite:'other'}}));assert.throws(()=>preflight({cli:'zcode',model:'zai/test',settingsFile:path}));
 writeFileSync(path,JSON.stringify({model:{main:'zai/test',lite:'zai/test'}}));preflight({cli:'zcode',model:'zai/test',settingsFile:path});
 const state={eventCounts:{},toolEvents:[]};decode('zcode',{type:'result',sessionId:'s',traceId:'t',response:'OK',usage:{inputTokens:12,outputTokens:2}},state);assert.equal(state.output,'OK');assert.equal(state.nativeTraceId,'t');assert.equal(state.usage.inputTokens,12);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('ZCode nested billing failure preserves provider status and non-retryability',()=>{
 const state={eventCounts:{},toolEvents:[]};decode('zcode',{type:'turn.failed',payload:{error:{code:'1113',message:'Insufficient balance or no resource package',attribution:{statusCode:429,retryable:false}}}},state);
 assert.equal(state.error.category,'billing');assert.equal(state.error.httpStatus,429);assert.equal(state.retryable,false);assert.equal(state.providerErrorCode,'1113');
});

test('Vibe ignores user and unfinished messages, keeps completed assistant content',()=>{
 const state={eventCounts:{},toolEvents:[]};
 decode('vibe',{type:'message',role:'user',sessionId:'s',generationStatus:'completed',content:[{type:'text',text:'PRIVATE'}]},state);assert.equal(state.output,undefined);
 decode('vibe',{type:'message',role:'assistant',generationStatus:'streaming',content:[{type:'text',text:'partial'}]},state);assert.equal(state.output,undefined);
 decode('vibe',{type:'message',role:'assistant',generationStatus:'completed',content:[{type:'text',text:'OK'}]},state);assert.equal(state.output,'OK');assert.equal(state.sessionId,'s');assert.equal(state.observedModel,null);
 const cmd=command({cli:'vibe',model:'test-model'},'p');assert.ok(cmd.args.includes('plan'));assert.equal(cmd.args[cmd.args.indexOf('--disabled-tools')+1],'*');
});
test('Provider camel-case total and reasoning counts are preserved',()=>{const u=usage({totalTokens:42,reasoningTokens:0});assert.equal(u.totalTokens,42);assert.equal(u.reasoningTokens,0);});

test('Muse defaults to Contributor only when no explicit model is selected',()=>{
 const defaults=command({cli:'muse'},'p');assert.equal(defaults.args[defaults.args.indexOf('--model')+1],'muse-spark-1.3-contributor');
 const explicit=command({cli:'muse',model:'muse-spark-1.3'},'p');assert.equal(explicit.args[explicit.args.indexOf('--model')+1],'muse-spark-1.3');
 assert.throws(()=>command({cli:'cursor'},'p'));
});
