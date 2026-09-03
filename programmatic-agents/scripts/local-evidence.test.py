import importlib.util, unittest, tempfile, json, sqlite3
from pathlib import Path
spec=importlib.util.spec_from_file_location('evidence',Path(__file__).with_name('local-evidence.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def test_identity(self):
  with self.assertRaises(ValueError):m.collect('muse','../../auth.json')
 def test_cumulative_not_sum(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'events.jsonl';e={'payload':{'type':'token_count','info':{'total_token_usage':{'input_tokens':5}}}}
   p.write_text(json.dumps(e)+'\n'+json.dumps(e)+'\n')
   self.assertEqual(m.inspect_jsonl(p)['latestCumulativeUsage']['input_tokens'],5)
 def test_database_excludes_payload(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'store.db';c=sqlite3.connect(p);c.execute('create table blobs(id text,data blob)');c.execute("insert into blobs values('x','PRIVATE')");c.commit();c.close()
   result=m.inspect_db(p);self.assertEqual(result['tables']['blobs']['rows'],1);self.assertNotIn('PRIVATE',json.dumps(result))
 def test_vibe_matches_full_session_and_omits_private_fields(self):
  with tempfile.TemporaryDirectory() as d:
   sid='865bdf22-6e37-54f1-9827-30571bdfb324'
   p=Path(d)/'.vibe/logs/session/session_20260903_000000_865bdf22/meta.json';p.parent.mkdir(parents=True)
   data={'session_id':sid,'system_prompt':'PRIVATE','stats':{'session_prompt_tokens':7,'other':'PRIVATE'},'config':{'active_model':'alias','models':{'alias':{'name':'model'}},'api_key':'PRIVATE'}}
   p.write_text(json.dumps(data));result=m.collect('vibe',sid,d)
   self.assertEqual(result['configuredModel'],'model');self.assertEqual(result['stats']['session_prompt_tokens'],7);self.assertNotIn('PRIVATE',json.dumps(result))
   data['session_id']='865bdf22-6e37-54f1-9827-30571bdfb325';p.write_text(json.dumps(data));self.assertEqual(m.collect('vibe',sid,d)['status'],'not_found')
if __name__=='__main__':unittest.main()
