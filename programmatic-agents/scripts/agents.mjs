#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, writeFileSync, appendFileSync, renameSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const hash = text => createHash('sha256').update(text).digest('hex');
export function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, /password|secret|authorization|cookie|api.?key|access.?token|refresh.?token/i.test(k) ? '[REDACTED]' : redact(v)]));
  return typeof value === 'string' ? value.replace(/(set-cookie['"]?\s*:\s*)[^\n]+/gi, '$1[REDACTED]').replace(/\bBearer\s+[^\s"',]+/gi, 'Bearer [REDACTED]').replace(/\b(?:sk-|gh[pousr]_|hf_|xox[baprs]-)[\w-]{8,}/g, '[REDACTED]').replace(/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|password)\s*[:=]\s*)[^\s,"'}]+/gi, '$1[REDACTED]') : value;
}
export function classify(message, httpStatus) {
  if (httpStatus === 402 || /payment|required.*credits|billing|insufficient.*balance/i.test(message)) return 'billing';
  if (httpStatus === 429 || /rate.?limit|too many requests/i.test(message)) return 'rate_limit';
  if ([401,403].includes(httpStatus) || /unauth|not logged|login required/i.test(message)) return 'authentication';
  if (/model.*(?:unavailable|not found|unsupported)/i.test(message)) return 'model_unavailable';
  if (/timeout|timed out/i.test(message)) return 'timeout';
  if (httpStatus >= 500) return 'provider';
  return 'execution';
}
export function command(c, prompt) {
  if(c.cli === 'muse' && c.model == null) c={...c,model:'muse-spark-1.3-contributor'};
  if (!['codex','cursor','antigravity','muse','deepcode','zcode','devin','vibe'].includes(c.cli)) throw Error('Unsupported cli');
  if (!c.model || typeof c.model !== 'string') throw Error('An exact model is required');
  const local = name => existsSync(join(homedir(), '.local/bin', name)) ? join(homedir(), '.local/bin', name) : name;
  let bin, args;
  if (c.cli === 'codex') {
    bin = ['/Applications/Codex.app/Contents/Resources/codex','/Applications/ChatGPT.app/Contents/Resources/codex'].find(existsSync) || 'codex';
    args = ['exec','--ephemeral','--sandbox','read-only','--json','--color','never','--skip-git-repo-check','--model',c.model];
    if (c.reasoning) args.push('-c',`model_reasoning_effort=${JSON.stringify(c.reasoning)}`);
    args.push('-');
  } else if (c.cli === 'cursor') {
    if (c.reasoning) throw Error('Cursor reasoning belongs in the exact model identifier; omit reasoning');
    bin = local('agent'); args = ['-p','--mode','ask','--sandbox','enabled','--model',c.model,'--output-format','stream-json'];
    args.push('--stream-partial-output');
    if (c.trustWorkspace === true) args.push('--trust');
    args.push(prompt);
  } else if (c.cli === 'antigravity') {
    bin = local('agy'); args = ['-p',prompt,'--model',c.model,'--mode','plan','--sandbox','--output-format','stream-json','--print-timeout',`${c.timeoutSeconds ?? 180}s`];
    if (c.reasoning) args.push('--effort',c.reasoning);
  } else if (c.cli === 'deepcode') {
    bin=local('deepcode'); args=['--exec','--prompt',prompt];
  } else if (c.cli === 'zcode') {
    if(c.reasoning) throw Error('ZCode reasoning must be configured in its settings; omit reasoning');
    bin=process.execPath; args=[c.zcodeEntry || '/Applications/ZCode.app/Contents/Resources/glm/zcode.cjs','--prompt',prompt,'--mode','plan','--output-format','stream-json','--no-color'];
    if(c.settingsFile) throw Error('Installed ZCode CLI advertises but rejects --settings; configure ~/.zcode/cli/config.json instead');
  } else if (c.cli === 'vibe') {
    bin=local('vibe'); args=['--prompt',prompt,'--agent','plan','--disabled-tools','*','--max-turns',String(c.maxTurns ?? 4),'--output','streaming'];
    if(c.trustWorkspace === true) args.push('--trust');
  } else if (c.cli === 'devin') {
    if(c.reasoning) throw Error('Use the exact Devin model variant; omit reasoning');
    bin=local('devin'); args=['-p',prompt,'--model',c.model,'--permission-mode','auto','--sandbox'];
    if(c.trustWorkspace === true) args.push('--respect-workspace-trust','false');
  } else {
    bin = local('muse'); args = ['exec','--model',c.model,'--json','--disable-write','--disable-shell','--disable-web-tools','--no-foreign-personal-context','--no-session-log'];
    if (c.reasoning) args.push('--reasoning-effort',c.reasoning);
    args.push(prompt);
  }
  if(c.retainLocalSession === true){const flag=c.cli === 'codex'?'--ephemeral':c.cli === 'muse'?'--no-session-log':null;const index=args.indexOf(flag);if(index>=0)args.splice(index,1);}
  return {bin:c.binary || bin,args,stdin:c.cli === 'codex' ? prompt : ''};
}
const number = (...values) => values.find(v => typeof v === 'number' && Number.isFinite(v)) ?? null;
export function usage(raw) {
  return {inputTokens:number(raw?.input_tokens,raw?.inputTokens), outputTokens:number(raw?.output_tokens,raw?.outputTokens), cacheReadTokens:number(raw?.cached_input_tokens,raw?.cache_read_tokens,raw?.cacheReadTokens), cacheWriteTokens:number(raw?.cache_write_tokens,raw?.cacheWriteTokens), reasoningTokens:number(raw?.thinking_tokens,raw?.reasoning_tokens,raw?.reasoningTokens), totalTokens:number(raw?.total_tokens,raw?.totalTokens), raw:raw ?? null};
}
// Price explicit, non-overlapping token categories only. Never infer a subscription invoice.
export function estimate(u, pricing) {
  if (!pricing) return {amount:null,currency:null,source:null,reason:'No pricing supplied'};
  if (!pricing.source || !pricing.asOf || !pricing.currency || !pricing.tokenFields || !Object.keys(pricing.tokenFields).length) throw Error('pricing requires source, asOf, currency, tokenFields');
  let amount=0;
  for (const [field, rate] of Object.entries(pricing.tokenFields)) {
    if (!['inputTokens','outputTokens','cacheReadTokens','cacheWriteTokens','reasoningTokens','totalTokens'].includes(field) || typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0) throw Error('Invalid pricing token field/rate');
    if (u[field] === null) return {amount:null,...pricing,reason:`Missing ${field}`};
    amount += u[field] * rate / 1e6;
  }
  return {amount,...pricing,reason:'User-supplied rates; token fields must be non-overlapping'};
}
export function decodeDevin(e, state) {
  state.sessionId=e.session_id ?? null;
  state.permissionMode=e.agent?.extra?.permission_mode ?? null;
  const m=e.final_metrics || {};
  state.usage=usage({input_tokens:m.total_prompt_tokens,output_tokens:m.total_completion_tokens,cached_input_tokens:m.total_cached_tokens});
  state.nativeStepCount=m.total_steps ?? e.steps?.length ?? null;
  state.generationModels=[...new Set((e.steps || []).map(s=>s.extra?.generation_model).filter(Boolean))];
  state.observedModel=state.generationModels.length === 1 ? state.generationModels[0] : null;
  state.steps=Object.fromEntries((e.steps || []).map(s=>[s.step_id,{index:s.step_id,timestamp:s.timestamp,source:s.source,model:s.extra?.generation_model ?? null,metrics:s.metrics ?? null,toolCalls:(s.tool_calls || []).map(t=>({id:t.tool_call_id,name:t.function_name}))}]));
}
export function preflight(c) {
  if(c.cli === 'zcode') {
    const cfg=JSON.parse(readFileSync(c.settingsFile || join(homedir(),'.zcode/cli/config.json'),'utf8'));
    if(cfg.model?.main !== c.model || cfg.model?.lite !== c.model) throw Error('ZCode main and lite settings must both match the requested provider/model identifier');
  }
  if(c.cli === 'deepcode') {
    const paths=[join(homedir(),'.deepcode/settings.json'),join(resolve(c.cwd || process.cwd()),'.deepcode/settings.json')];
    const cfg=paths.map(p=>existsSync(p)?JSON.parse(readFileSync(p,'utf8')):{});
    const permissions=cfg[1].permissions ?? cfg[0].permissions;
    if(permissions?.defaultMode !== 'askAll' || cfg.some(x=>(x.permissions?.allow || []).length)) throw Error('Deep Code requires askAll permissions with no allow rules for noninteractive runs');
    if(cfg.some(x=>Object.keys(x.mcpServers || {}).length)) throw Error('Deep Code adapter requires settings without MCP servers');
  }
}
export function decode(cli, e, state) {
  if(cli === 'vibe') {
    state.sessionId ??=e.sessionId ?? e.session_id;
    if(e.type === 'message' && e.role === 'assistant' && (e.generationStatus ?? e.generation_status) === 'completed') state.output=(e.content || []).filter(p=>p.type === 'text').map(p=>p.text || '').join('\n\n');
  }
  if(cli === 'zcode') {
    state.sessionId ??=e.sessionId;
    state.nativeTraceId ??=e.traceId;
    if(e.payload?.error){state.lastHttpStatus=e.payload.error.attribution?.statusCode ?? null;state.providerErrorCode=e.payload.error.code ?? null;state.retryable=e.payload.error.attribution?.retryable ?? null;}
    if(e.type === 'result') {state.output=e.response;state.projection=e.projection;}
    if(e.type === 'model.streaming' && e.payload?.kind === 'text_delta') {state.output=(state.output || '')+(e.payload.delta || '');state.streamDeltaCount++;}
  }
  const type = e.payload_type ?? e.type ?? e.event ?? 'result';
  if (cli === 'antigravity' && e.event === 'result') { decode(cli,e.result,state); return; }
  if ((cli === 'cursor' && e.type === 'system') || (cli === 'antigravity' && e.event === 'init')) {
    state.configuredModel=e.init?.model ?? e.model ?? null;
    state.permissionMode=e.init?.permission_mode ?? e.permissionMode ?? null;
    state.availableTools=e.init?.tools ?? e.tools ?? null;
  }
  if (cli === 'cursor' && e.type === 'assistant' && e.timestamp_ms != null && e.model_call_id == null) {
    state.output=(state.output || '')+(e.message?.content || []).filter(p=>p.type === 'text').map(p=>p.text || '').join('');
    state.streamDeltaCount=(state.streamDeltaCount || 0)+1;
  }
  if (cli === 'antigravity' && e.event === 'step_update') {
    const step=e.step_update;
    state.sessionId ??=step.conversation_id;
    state.steps ??={};
    state.steps[step.step_index]={index:step.step_index,type:step.step_type,status:step.state,tool:step.tool_name ?? null,durationMs:typeof step.duration_seconds === 'number'?step.duration_seconds*1000:null,usage:step.usage?usage(step.usage):null};
    if(step.step_type === 'agent_response' && step.text_delta){state.output=(state.output || '')+step.text_delta;state.streamDeltaCount=(state.streamDeltaCount || 0)+1;}
    if(step.subagent_info)state.childSessions=(step.subagent_info.subagents || []).map(child=>({conversationId:child.conversation_id,role:child.role,type:child.type_name}));
  }
  state.eventCounts[type]=(state.eventCounts[type] || 0)+1;
  state.sessionId ??= e.thread_id ?? e.session_id ?? e.conversation_id ?? (e.stream?.kind === 'session' ? e.stream.id : null);
  state.requestId ??= e.request_id ?? null;
  state.observedModel ??= e.response?.model ?? (cli !== 'muse' && e.type !== 'system' ? e.model : null) ?? null;
  if (e.usage) state.usage = usage(e.usage);
  if (e.response?.usage) state.usage = usage(e.response.usage);
  if (cli === 'codex' && e.type === 'item.completed' && e.item?.type === 'agent_message') state.output=e.item.text;
  if (cli === 'cursor' && e.type === 'result') state.output=e.result;
  if (cli === 'antigravity' && typeof e.response === 'string') state.output=e.response;
  if (cli === 'muse' && type === 'run.output.delta') state.output=(state.output || '')+(e.payload?.text || '');
  if (cli === 'muse' && type === 'run.terminal.completed') state.output=e.payload?.text ?? state.output;
  // Startup configuration is not independent evidence of the served model.
  if (cli === 'muse' && type === 'run.model.configured') state.configuredModel=e.payload?.model_id;
  const facets=e.payload?.event?.details?.facets || [];
  const attempt=facets.find(f=>f.kind === 'external_attempt');
  if (attempt) {
    state.providerAttemptsObserved=Math.max(state.providerAttemptsObserved ?? 0,attempt.attempt || 0);
    if (attempt.http_status) state.lastHttpStatus=attempt.http_status;
    if (attempt.http_status === 402) state.error={category:'billing',message:'Provider requires payment',httpStatus:402};
  }
  for (const f of facets) if(f.detail?.request_id) state.requestId=f.detail.request_id;
  if (e.is_error || e.type === 'error' || e.type === 'turn.failed' || /terminal\.(failed|cancelled)$/.test(type) || e.status === 'FAILED' || e.status === 'ERROR') {
    const message=(typeof e.error === 'string'?e.error:e.error?.message) ?? e.payload?.error?.message ?? e.message ?? e.payload?.reason ?? (typeof e.result === 'string' ? e.result : 'CLI reported failure');
    state.error={category:classify(String(message),state.lastHttpStatus),message:redact(String(message)),httpStatus:state.lastHttpStatus};
  }
  if (/tool|command_execution|file_change|web_search/.test(e.item?.type || type)) state.toolEvents.push({type:e.item?.type || type,status:e.item?.status ?? e.subtype ?? e.payload?.event?.kind ?? null,callId:e.call_id ?? e.item?.id ?? null,name:e.tool_call?Object.keys(e.tool_call)[0]:null});
  state.cliReportedDurationMs=number(e.duration_ms,typeof e.duration_seconds === 'number' ? e.duration_seconds*1000 : null,state.cliReportedDurationMs);
  state.cliReportedApiDurationMs=number(e.duration_api_ms,state.cliReportedApiDurationMs);
  state.turns=number(e.num_turns,state.turns);
  if (typeof e.total_cost_usd === 'number' && Number.isFinite(e.total_cost_usd)) state.reportedCost={amount:e.total_cost_usd,currency:'USD',source:'CLI total_cost_usd'};
}

export async function run(config, prompt) {
  const c={timeoutSeconds:180,maxOutputBytes:16*1024*1024,captureContent:false,...config};
  if(c.cli === 'muse' && c.model == null) c.model='muse-spark-1.3-contributor';
  if (!Number.isFinite(c.timeoutSeconds) || c.timeoutSeconds<=0) throw Error('timeoutSeconds must be positive');
  if (!Number.isFinite(c.maxOutputBytes) || c.maxOutputBytes<=0) throw Error('maxOutputBytes must be positive');
  if (typeof prompt !== 'string' || !prompt.trim()) throw Error('Nonempty prompt required');
  const cmd=command(c,prompt);
  preflight(c);
  if(c.pricing) estimate(usage(null),c.pricing);
  const runId=randomUUID(), startedAt=new Date().toISOString(), start=performance.now();
  const dir=resolve(c.logDir || './agent-runs',runId); mkdirSync(dir,{recursive:true,mode:0o700});
  const trace=join(dir,'trace.jsonl');
  const nativeExport=join(dir,'native-export.json');
  if(c.cli === 'devin') cmd.args.push('--export',nativeExport);
  const emit=(kind,data={})=>appendFileSync(trace,JSON.stringify(redact({schemaVersion:1,runId,at:new Date().toISOString(),elapsedMs:performance.now()-start,kind,...data}))+'\n',{mode:0o600});
  let version=null;
  try { version=execFileSync(cmd.bin,c.cli === 'zcode'?[cmd.args[0],'--version']:['--version'],{encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore']}).trim().slice(0,300); } catch {}
  const state={output:null,observedModel:null,configuredModel:null,sessionId:null,requestId:null,usage:usage(null),error:null,lastHttpStatus:null,eventCounts:{},toolEvents:[],providerAttemptsObserved:null,steps:{},childSessions:[],streamDeltaCount:0,permissionMode:null,availableTools:null,turns:null,reportedCost:null,cliReportedDurationMs:null,cliReportedApiDurationMs:null};
  emit('start',{cli:c.cli,version,requestedModel:c.model,promptHash:hash(prompt),promptBytes:Buffer.byteLength(prompt),tags:c.tags ?? {},...(c.captureContent?{prompt}:{})});
  const spawnAt=performance.now(); let firstStdoutMs=null,firstAnswerEventMs=null,bytes=0,stderr='',buffer='',parseErrors=0,exitCode=null,signal=null;
  await new Promise(done=>{
    const child=spawn(cmd.bin,cmd.args,{cwd:c.cwd || process.cwd(),stdio:['pipe','pipe','pipe'],env:c.cli === 'vibe'?{...process.env,VIBE_ACTIVE_MODEL:c.model,VIBE_MODELS:JSON.stringify({[c.model]:{name:c.model,alias:c.model,provider:'mistral',thinking:c.reasoning ?? 'off'}})}:c.cli === 'deepcode'?{...process.env,DEEPCODE_MODEL:c.model,DEEPCODE_BASE_URL:'https://api.deepseek.com',DEEPCODE_TELEMETRY_ENABLED:'false',...(c.reasoning?{DEEPCODE_REASONING_EFFORT:c.reasoning}:{})}:process.env,detached:process.platform !== 'win32'});
    let escalation,finished=false;
    const stop=()=>{ try {if(process.platform !== 'win32') process.kill(-child.pid,'SIGTERM');else child.kill('SIGTERM');}catch{}; escalation ??=setTimeout(()=>{try{if(process.platform !== 'win32')process.kill(-child.pid,'SIGKILL');else child.kill('SIGKILL');}catch{}},1000); };
    const timer=setTimeout(()=>{state.error={category:'timeout',message:'Wrapper deadline exceeded',httpStatus:state.lastHttpStatus};stop();},c.timeoutSeconds*1000);
    const interrupt=()=>{state.error={category:'cancelled',message:'Run interrupted',httpStatus:null};stop();};
    process.once('SIGINT',interrupt);process.once('SIGTERM',interrupt);
    const consume=line=>{if(!line.trim())return;let e;try{e=JSON.parse(line);}catch{parseErrors++;return;}
      const before=state.output;decode(c.cli,e,state);
      if(state.output !== before && state.output) firstAnswerEventMs ??=performance.now()-spawnAt;
      emit('cli_event',{type:e.payload_type ?? e.type ?? e.event ?? 'result',sessionId:state.sessionId,requestId:state.requestId,httpStatus:state.lastHttpStatus,providerAttemptsObserved:state.providerAttemptsObserved,...(e.usage?{usage:usage(e.usage)}:{}),...(e.step_update?{step:state.steps[e.step_update.step_index]}:{}),...(e.type === 'tool_call'?{tool:state.toolEvents.at(-1)}:{}),...(c.captureContent?{event:e}:{})});
      if(state.error?.category === 'billing')stop();
    };
    child.stdout.setEncoding('utf8').on('data',chunk=>{firstStdoutMs ??=performance.now()-spawnAt;bytes+=Buffer.byteLength(chunk);if(bytes>c.maxOutputBytes){state.error={category:'output_limit',message:'CLI output exceeded limit',httpStatus:null};stop();return;}if(['deepcode','devin'].includes(c.cli)){state.output=(state.output || '')+chunk;return;}buffer+=chunk;let i;while((i=buffer.indexOf('\n'))>=0){consume(buffer.slice(0,i));buffer=buffer.slice(i+1);}});
    child.stderr.setEncoding('utf8').on('data',chunk=>{stderr=(stderr+chunk).slice(-8192);});
    child.stdin.on('error',()=>{});child.stdin.end(cmd.stdin);
    const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);clearTimeout(escalation);process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',interrupt);if(buffer.trim())consume(buffer);clearTimeout(escalation);done();};
    child.on('error',e=>{state.error={category:'spawn',message:redact(e.message),httpStatus:null};finish();});
    child.on('close',(code,sig)=>{exitCode=code;signal=sig;finish();});
  });
  if(c.cli === 'devin') {
    try {const native=JSON.parse(readFileSync(nativeExport,'utf8'));decodeDevin(native,state);emit('native_export',{steps:state.steps,usage:state.usage,...(c.captureContent?{event:native}:{})});}
    catch {if(!state.error && exitCode === 0) state.error={category:'invalid_export',message:'Devin did not produce a readable native export',httpStatus:null};}
    finally {rmSync(nativeExport,{force:true});}
    if(state.generationModels?.some(m=>m !== c.model)) state.error={category:'model_mismatch',message:'Native trajectory includes a different generation model',httpStatus:null};
  }
  if(c.cli === 'vibe' && state.sessionId) {
    try {
      const evidence=JSON.parse(execFileSync(c.pythonBinary || 'python3',[fileURLToPath(new URL('./local-evidence.py',import.meta.url)),'--cli','vibe','--session',state.sessionId],{encoding:'utf8',timeout:10000,stdio:['ignore','pipe','ignore']}));
      state.localEvidence=evidence;state.configuredModel=evidence.configuredModel ?? null;
      const u=evidence.stats || {};
      state.usage=usage({input_tokens:u.session_prompt_tokens,output_tokens:u.session_completion_tokens,cached_input_tokens:u.session_cached_tokens,total_tokens:u.session_total_llm_tokens});
      state.cliConfiguredCost={amount:u.session_cost ?? null,currency:'USD',source:'Vibe local config estimate; not billed cost'};
      if(state.configuredModel !== c.model) state.error={category:'model_configuration',message:'Native Vibe session does not confirm the requested model configuration',httpStatus:null};
    } catch {state.error ??={category:'invalid_export',message:'Vibe session metadata unavailable for model configuration verification',httpStatus:null};}
  }
  if(['deepcode','devin'].includes(c.cli) && state.output) state.output=state.output.trim();
  if(!state.error && (exitCode !== 0 || signal))state.error={category:classify(stderr),message:redact(stderr || `Process exited ${exitCode}/${signal}`),httpStatus:state.lastHttpStatus};
  if(!state.error && state.observedModel && state.observedModel !== c.model)state.error={category:'model_mismatch',message:'Reported model differs from requested model',httpStatus:null};
  if(!state.error && !state.output)state.error={category:'invalid_output',message:'No supported assistant result found',httpStatus:null};
  const result={schemaVersion:1,adapterVersion:4,runId,traceId:runId,parentRunId:c.parentRunId ?? null,logicalItemId:c.logicalItemId ?? null,attempt:c.attempt ?? 1,tags:c.tags ?? {},configHash:hash(JSON.stringify(c)),settings:{timeoutSeconds:c.timeoutSeconds,maxOutputBytes:c.maxOutputBytes,trustWorkspace:c.trustWorkspace === true,captureContent:c.captureContent,wrapperRetries:0,retainLocalSession:c.retainLocalSession === true,localEvidence:c.localEvidence === true},startedAt,endedAt:new Date().toISOString(),cli:c.cli,cliVersion:version,binary:cmd.bin,platform:process.platform,nodeVersion:process.version,requestedModel:c.model,dataSharingTier:c.cli === 'muse'?(c.model.endsWith('-contributor')?'contributor':'standard'):null,reasoningSetting:c.reasoning ?? null,executionMode:c.cli === 'cursor'?'ask':['antigravity','zcode','vibe'].includes(c.cli)?'plan':c.cli === 'devin'?'auto+sandbox':c.cli === 'deepcode'?'askAll':'read-only',cwd:resolve(c.cwd || process.cwd()),promptHash:hash(prompt),promptBytes:Buffer.byteLength(prompt),status:state.error?'error':'success',...state,latency:{wallMs:performance.now()-start,processMs:performance.now()-spawnAt,firstStdoutMs,firstAnswerEventMs,ttftMs:null},cost:{reported:state.reportedCost,estimated:estimate(state.usage,c.pricing)},exitCode,signal,parseErrors,stdoutBytes:bytes,outputHash:state.output?hash(state.output):null,logDir:dir};
  if(c.localEvidence === true && state.sessionId && ['codex','cursor','antigravity','muse'].includes(c.cli)){
    try {result.localEvidence=JSON.parse(execFileSync(c.pythonBinary || 'python3',[fileURLToPath(new URL('./local-evidence.py',import.meta.url)),'--cli',c.cli,'--session',state.sessionId],{encoding:'utf8',timeout:10000,maxBuffer:4*1024*1024,stdio:['ignore','pipe','ignore']}));}
    catch {result.localEvidence={status:'unavailable',reason:'Local reader failed or timed out'};}
  }
  const saved={...result};if(!c.captureContent){delete saved.output;if(saved.error)saved.error={...saved.error,message:'Content omitted; inspect returned error or opt in to content capture'};}
  emit('end',{status:result.status,errorCategory:result.error?.category ?? null,latency:result.latency});
  writeFileSync(join(dir,'result.json.tmp'),JSON.stringify(redact(saved),null,2)+'\n',{mode:0o600});renameSync(join(dir,'result.json.tmp'),join(dir,'result.json'));
  return result;
}
if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [configFile,promptFile,...extra]=process.argv.slice(2);
    if(!configFile || !promptFile || extra.length)throw Error('Usage: node agents.mjs CONFIG.json PROMPT.txt');
    const result=await run(JSON.parse(readFileSync(configFile,'utf8')),readFileSync(promptFile,'utf8'));
    console.log(JSON.stringify(redact(result),null,2));if(result.status !== 'success')process.exitCode=1;
  }catch(e){console.error(redact(e.message));process.exitCode=1;}
}
