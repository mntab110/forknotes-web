const ALLOWED = new Set(['verification_page_opened','verification_confirmed','verification_failed','verification_open_app_clicked']);
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function createVerificationAnalytics({token='',fetcher=fetch,anonymousId=globalThis.crypto?.randomUUID?.() || 'anonymous-'+Math.random().toString(36).slice(2)}={}) {
 let id='verification:'+anonymousId, internal=false;
 return {
  identify(user) {
   if (!UUID.test(user?.id || '')) return;
   id='forksmart:'+user.id;
   const email=String(user.email || '').trim();
   internal=/@appsimple\.com$/i.test(email)||/^(sandbox|tester)\d*[@+]/i.test(email)||email.toLowerCase()==='matt@tabrizi.me';
  },
  capture(event,reason) {
   if (!token || !ALLOWED.has(event)) return;
   const properties={distinct_id:id,app:'forksmart',environment:'production',is_internal:internal,is_demo:false,schema_version:2,source:'confirmation_web',$geoip_disable:true,$process_person_profile:false};
   if (['link_unavailable','verification_check_failed'].includes(reason)) properties.reason=reason;
   // Never send the URL, access token, email, provider error, or page contents.
   try { Promise.resolve(fetcher('https://us.i.posthog.com/i/v0/e/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:token,event,properties}),keepalive:true})).catch(()=>{}); } catch (_) {}
  }
 };
}
