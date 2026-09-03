#!/usr/bin/env python3
"""Read one explicitly identified CLI session. Never read auth/config/global stores."""
import argparse, collections, datetime, json, os, sqlite3, uuid
from pathlib import Path


def inspect_jsonl(path):
    counts=collections.Counter(); nested=collections.Counter(); invalid=0; latest_usage=None; resources=[]; context=[]
    before=path.stat(); timestamps=[]
    with path.open() as stream:
        for line in stream:
            try: e=json.loads(line)
            except (ValueError,UnicodeError): invalid+=1; continue
            if not isinstance(e,dict): continue
            counts[e.get('payload_type',e.get('type','unknown'))]+=1
            p=e.get('payload',{})
            if not isinstance(p,dict): continue
            inner=p.get('event',{})
            if isinstance(inner,dict):
                nested[inner.get('payload_type',inner.get('type',inner.get('kind','unknown')))]+=1
                if inner.get('kind')=='resource_usage_sampled' and isinstance(inner.get('usage'),dict):
                    resources.append({k:v for k,v in inner['usage'].items() if isinstance(v,(int,float))})
                if inner.get('kind')=='context_block_diagnostic':
                    context.append({k:inner[k] for k in ['text_bytes','max_bytes'] if isinstance(inner.get(k),(int,float))})
            if isinstance(e.get('timestamp'),str):timestamps.append(e['timestamp'])
            # Codex cumulative counters: take latest; never sum repeated token_count updates.
            if p.get('type') == 'token_count':
                u=p.get('info',{}).get('total_token_usage') if isinstance(p.get('info'),dict) else None
                if isinstance(u,dict):latest_usage={k:v for k,v in u.items() if k.endswith('tokens') and isinstance(v,(int,float))}
    after=path.stat()
    return {'resourceSamples':resources,'contextBlockSizes':context,'eventCounts':dict(counts),'nestedEventCounts':dict(nested),'malformedLines':invalid,'latestCumulativeUsage':latest_usage,'firstTimestamp':timestamps[0] if timestamps else None,'lastTimestamp':timestamps[-1] if timestamps else None,'bytesBefore':before.st_size,'bytesAfter':after.st_size,'changedWhileReading':before.st_size!=after.st_size}


def inspect_db(path):
    # SQLite read transaction includes committed WAL data. No immutable mode on a live DB.
    c=sqlite3.connect(path.as_uri()+'?mode=ro',uri=True,timeout=1)
    try:
        c.execute('PRAGMA query_only=ON');c.execute('BEGIN')
        allowed={'blobs','meta','steps','gen_metadata','executor_metadata','parent_references','trajectory_meta','trajectory_metadata_blob','battle_mode_infos'}
        tables=[r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'") if r[0] in allowed]
        result={}
        for name in tables:
            columns=[r[1] for r in c.execute('PRAGMA table_info("'+name+'")')]
            result[name]={'columns':columns,'rows':c.execute('SELECT count(*) FROM "'+name+'"').fetchone()[0]}
        return {'tables':result,'payloadsDecoded':False}
    finally:c.close()


def collect(cli,session,home=None):
    # Prevent path traversal or broad glob input. No "latest" fallback.
    uuid.UUID(session)
    if session.lower()!=str(uuid.UUID(session)):raise ValueError('Canonical UUID required')
    home=Path(home or Path.home()).resolve()
    if cli=='vibe': paths=list((home/'.vibe/logs/session').glob('session_*_'+session[:8]+'/meta.json'))
    elif cli=='cursor': paths=list((home/'.cursor/chats').glob('*/'+session+'/store.db'))
    elif cli=='antigravity':paths=[home/'.gemini/antigravity-cli/conversations'/f'{session}.db']
    elif cli=='muse':paths=list((home/'.local/share/muse/sessions').glob('*/*/*/'+session+'/session.jsonl'))
    elif cli=='codex':paths=list((home/'.codex/sessions').glob('*/*/*/rollout-*'+session+'.jsonl'))
    else:raise ValueError('Unsupported CLI')
    out={'schemaVersion':1,'sourceStability':'undocumented-local-store','cli':cli,'sessionId':session,'observedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':[]}
    for p in paths:
        if not p.is_file():continue
        if p.is_symlink() or home not in p.resolve().parents:continue
        if cli=='vibe':
            meta=json.loads(p.read_text())
            if meta.get('session_id')!=session: continue
            cfg=meta.get('config',{});alias=cfg.get('active_model');models=cfg.get('models',{})
            model=models.get(alias,{}) if isinstance(models,dict) else next((m for m in models if m.get('alias')==alias),{})
            out['configuredModel']=model.get('name');out['configuredAlias']=alias
            out['stats']={k:v for k,v in meta.get('stats',{}).items() if isinstance(v,(int,float))}
            out['nativeStartedAt']=meta.get('start_time');out['nativeEndedAt']=meta.get('end_time')
            out['files'].append({'path':str(p),'sizeBytes':p.stat().st_size});continue
        row={'path':str(p),'sizeBytes':p.stat().st_size,'mtimeNs':p.stat().st_mtime_ns}
        try:row['summary']=inspect_jsonl(p) if p.suffix=='.jsonl' else inspect_db(p)
        except (sqlite3.Error,OSError) as e:row['readError']=type(e).__name__ # No partial/incorrect immutable fallback.
        out['files'].append(row)
    out['status']='found' if out['files'] else 'not_found'
    return out

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--cli',required=True,choices=['codex','cursor','antigravity','muse','vibe']);p.add_argument('--session',required=True)
    a=p.parse_args();print(json.dumps(collect(a.cli,a.session),indent=2))
