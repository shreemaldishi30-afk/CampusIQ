(() => {
 const $=id=>document.getElementById(id);
 const nameEl=$('share-name'), sessionEl=$('share-session'), enabled=$('share-enabled'), join=$('share-join'), create=$('share-create'), copy=$('share-copy'), copyLink=$('share-link-copy'), nativeShare=$('share-native'), invite=$('share-invite'), codeDisplay=$('share-code-display'), status=$('share-status'), peers=$('peer-list');
 const markers=new Map(); let ownMarker=null, timer=null, tickRunning=false;
 let clientId=sessionStorage.getItem('campusiq-client-id');
 if(!clientId){clientId=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():('u'+Date.now().toString(36)+Math.random().toString(36).slice(2));sessionStorage.setItem('campusiq-client-id',clientId);}
 function valid(){return !!(nameEl.value.trim()&&sessionEl.value.trim())}
 function newCode(){return 'MUJ-'+Math.random().toString(36).slice(2,6).toUpperCase()+'-'+Math.random().toString(36).slice(2,6).toUpperCase()}
 function inviteUrl(){const u=new URL(window.location.href);u.searchParams.set('join',sessionEl.value.trim());return u.toString()}
 function showInvite(){codeDisplay.textContent=sessionEl.value.trim();invite.hidden=!sessionEl.value.trim();copy.disabled=!sessionEl.value.trim();}
 function originHint(){return /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname) ? ' IMPORTANT: this page is on localhost. Another laptop must use the same hosted HTTPS address; its own localhost is a different server.' : '';}
 async function postPosition(position, sharing=true){const payload={clientId,name:nameEl.value.trim(),session:sessionEl.value.trim(),lat:position.coords.latitude,lon:position.coords.longitude,sharing:sharing?1:0};const r=await fetch('/api/share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});if(!r.ok)throw new Error('Server rejected location update (HTTP '+r.status+')');}
 async function updatePeers(){
   const r=await fetch('/api/peers?session='+encodeURIComponent(sessionEl.value.trim()),{cache:'no-store'});
   if(!r.ok)throw new Error('Could not load friends from this server (HTTP '+r.status+').');
   const data=await r.json(), others=(data.peers||[]).filter(p=>p.clientId!==clientId);
   const currentIds=new Set(others.map(p=>p.clientId||p.name));
   for(const [id,marker] of markers){if(!currentIds.has(id)){if(window.campusIQMap)window.campusIQMap.removeLayer(marker);markers.delete(id)}}
   peers.replaceChildren();
   for(const person of others){
     if(!Number.isFinite(Number(person.lat))||!Number.isFinite(Number(person.lon)))continue;
     const id=person.clientId||person.name;let marker=markers.get(id);
     if(!marker){marker=L.marker([Number(person.lat),Number(person.lon)]).addTo(window.campusIQMap);markers.set(id,marker)}
     marker.setLatLng([Number(person.lat),Number(person.lon)]).bindPopup(`<strong>${String(person.name||'Friend').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</strong><br>Live location · shared session`);
     const el=document.createElement('p');el.textContent=`${person.name||'Friend'} · updated ${new Date(Number(person.updated||0)*1000).toLocaleTimeString()}`;peers.appendChild(el);
   }
   return others.length;
 }
 async function tick(){
   if(!valid()||!enabled.checked||tickRunning)return;tickRunning=true;
   let gpsMessage='';
   try{
     if(!navigator.geolocation)throw new Error('This browser does not support location access');
     const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:4000}));
     const lat=pos.coords.latitude,lon=pos.coords.longitude;
     if(!window.campusIQMap)throw new Error('Campus map is not ready yet; refresh and try again');
     if(!ownMarker){ownMarker=L.marker([lat,lon]).addTo(window.campusIQMap)}else ownMarker.setLatLng([lat,lon]);
     ownMarker.bindPopup(`<strong>${nameEl.value.trim()} (you)</strong><br>Live GPS location`);
     if(!window.__campusIQOwnCentered){window.campusIQMap.setView([lat,lon],Math.max(window.campusIQMap.getZoom(),17));window.__campusIQOwnCentered=true;}
     await postPosition(pos,true);
   }catch(e){
     if(e.code===1)gpsMessage='Location permission denied; allow location for this site';
     else if(e.code===2)gpsMessage='GPS position unavailable';
     else if(e.code===3)gpsMessage='GPS request timed out';
     else gpsMessage=e.message||'Could not update your location';
   }
   try{
     if(!window.campusIQMap)throw new Error('Campus map is not ready yet');
     const count=await updatePeers();
     status.textContent=count?`Connected to session ${sessionEl.value.trim()}: ${count} friend location(s) visible.${gpsMessage?' Your location is not updating: '+gpsMessage+'.':''}`:`Session ${sessionEl.value.trim()} is reachable; no other active participant is sharing yet.${gpsMessage?' Your location is not updating: '+gpsMessage+'.':''}`+originHint();
   }catch(e){status.textContent='Friend sync failed: '+e.message+originHint()}
   finally{tickRunning=false;}
 }
 function startSharing(){
   if(!valid()){status.textContent='Enter your name and session code first.';return;}
   showInvite();if(timer)clearInterval(timer);timer=null;
   if(!enabled.checked){status.textContent='Session is ready. Enable “Share my live location” and click Join friend’s session.'+originHint();return;}
   status.textContent='Joining shared session…'+originHint();tick();timer=setInterval(tick,4000);
 }
 create.addEventListener('click',()=>{if(!nameEl.value.trim()){status.textContent='Enter your name first, then create a session.';nameEl.focus();return;}sessionEl.value=newCode();showInvite();if(enabled.checked){status.textContent='Session created. Send the code or invite link to your friend; starting location sharing…'+originHint();startSharing()}else status.textContent='Session created. Send the code or invite link to your friend, then both enable location sharing and join the same session.'+originHint();});
 copy.addEventListener('click',async()=>{if(!sessionEl.value.trim())return;try{await navigator.clipboard.writeText(sessionEl.value.trim());status.textContent='Session code copied. Send it to your friend.'}catch(e){window.prompt('Copy this session code:',sessionEl.value.trim())}});
 copyLink.addEventListener('click',async()=>{if(!sessionEl.value.trim())return;const link=inviteUrl();try{await navigator.clipboard.writeText(link);status.textContent='Invite link copied. Both devices must open this same website origin.'+originHint()}catch(e){window.prompt('Copy this invite link:',link)}});
 nativeShare.addEventListener('click',async()=>{if(!sessionEl.value.trim())return;const data={title:'Join my CampusIQ location session',text:`Join my CampusIQ session with code ${sessionEl.value.trim()}`,url:inviteUrl()};if(navigator.share){try{await navigator.share(data);status.textContent='Invite shared. Both devices must open the same website origin.'+originHint()}catch(e){if(e.name!=='AbortError')status.textContent='Could not open sharing options. Use Copy invite link instead.'}}else{try{await navigator.clipboard.writeText(inviteUrl());status.textContent='Invite link copied.'+originHint()}catch(e){window.prompt('Copy this invite link:',inviteUrl())}}});
 join.addEventListener('click',()=>{if(!valid()){status.textContent='Enter your name and your friend’s session code first.';return;}startSharing()});
 enabled.addEventListener('change',async()=>{
   if(!enabled.checked){if(timer)clearInterval(timer);timer=null;if(valid())fetch('/api/share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientId,name:nameEl.value.trim(),session:sessionEl.value.trim(),lat:0,lon:0,sharing:0}),cache:'no-store'}).catch(()=>{});if(ownMarker&&window.campusIQMap){window.campusIQMap.removeLayer(ownMarker);ownMarker=null;}status.textContent='Your live location sharing is off. You will no longer publish your location.';try{await updatePeers()}catch(e){} }
   else status.textContent='Location sharing enabled. Create a session or enter your friend’s code, then click Join friend’s session.'+originHint();
 });
 sessionEl.addEventListener('input',showInvite);
 const params=new URLSearchParams(window.location.search), inviteCode=params.get('join');if(inviteCode){sessionEl.value=inviteCode;showInvite();status.textContent='Invite detected for session '+inviteCode+'. Enter your name, enable sharing, then click Join friend’s session.'+originHint();}
})();
