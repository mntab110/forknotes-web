import test from 'node:test';
import assert from 'node:assert/strict';
import { createVerificationAnalytics } from './Assets/verification-analytics.mjs';
test('web uses same pseudonymous identity as app and sends no email, token or URL',()=>{
 const payloads=[];const analytics=createVerificationAnalytics({token:'project-token',anonymousId:'test',fetcher:(_,options)=>{payloads.push(JSON.parse(options.body));return Promise.resolve();}});
 analytics.identify({id:'12345678-1234-1234-1234-123456789012',email:'private@example.com',access_token:'private-secret'});
 analytics.capture('verification_confirmed');analytics.capture('verification_open_app_clicked');analytics.capture('bad_event');
 assert.equal(payloads.length,2);assert.equal(payloads[0].properties.distinct_id,'forksmart:12345678-1234-1234-1234-123456789012');
 assert.equal(payloads[0].properties.$geoip_disable,true);assert.doesNotMatch(JSON.stringify(payloads),/private|https|access_token/);
});
test('missing config and analytics errors cannot block verification or navigation',()=>{
 const missing=createVerificationAnalytics({anonymousId:'a',fetcher:()=>{throw Error('unexpected');}});assert.doesNotThrow(()=>missing.capture('verification_confirmed'));
 const broken=createVerificationAnalytics({token:'project',anonymousId:'a',fetcher:()=>{throw Error('offline');}});assert.doesNotThrow(()=>broken.capture('verification_open_app_clicked'));
});
test('confirmation page validates against Auth rather than trusting decoded tokens',async()=>{
 const {readFile}=await import('node:fs/promises');const html=await readFile(new URL('./email-confirmed.html',import.meta.url),'utf8');
 assert.match(html,/auth\/v1\/user/);assert.match(html,/!response.ok \|\| !user.email_confirmed_at/);
 assert.match(html,/analytics.identify\(user\)/);assert.doesNotMatch(html,/atob\(/);
 assert.match(html,/history.replaceState/);assert.match(html,/verification_open_app_clicked/);
});
