import {firebaseConfig} from './config.js';
import {validateState,mergeState} from './state.js';
export function cloudPayload(state) {
 const result=validateState(state);
 if(!result.positionSync){result.positions={};for(const key of Object.keys(result.updated))if(key.startsWith('positions:'))delete result.updated[key];}
 return result;
}
export function createAuth(store,onChange) {
 let sdk=null,auth=null,db=null,user=null,status='',unsubscribe=null,timer=null,syncing=false,suppress=false;
 const available=!!firebaseConfig?.apiKey;
 async function connect(){
  if(sdk)return;
  const [app,a,f]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js')]);
  sdk={...a,...f};const instance=app.initializeApp(firebaseConfig);auth=a.getAuth(instance);db=f.getFirestore(instance);
 }
 function changed(){onChange();}
 async function sync(){
  if(!user||syncing)return;
  syncing=true;status='syncing';changed();
  try {
   const ref=sdk.doc(db,'users',user.uid,'progress','main');
   await sdk.runTransaction(db,async transaction=>{
    const remote=await transaction.get(ref);
    const local=cloudPayload(store.value);
    const merged=remote.exists()?mergeState(local,validateState(remote.data().state)):local;
    const filtered=cloudPayload({...merged,positionSync:store.value.positionSync});
    transaction.set(ref,{state:filtered});
   });
   status='syncSuccess';
  }catch{status='syncError';}finally{syncing=false;changed();}
 }
 async function watch(u){
  unsubscribe?.();user=u;
  if(!u){status='';changed();return;}
  unsubscribe=sdk.onSnapshot(sdk.doc(db,'users',u.uid,'progress','main'),snap=>{
   if(!snap.exists()||snap.metadata.hasPendingWrites)return;
   try {
    const remote=validateState(snap.data().state);
    if(!store.value.positionSync){remote.positions={};for(const key of Object.keys(remote.updated))if(key.startsWith('positions:')||key==='positionSync')delete remote.updated[key];}
    suppress=true;store.merge(remote);suppress=false;status='syncSuccess';changed();
   }catch{suppress=false;status='syncError';changed();}
  },()=>{status='syncError';changed();});
  await sync();
 }
 store.subscribe(()=>{if(user&&!suppress){clearTimeout(timer);timer=setTimeout(sync,900);}});
 return {
  get available(){return available;},get user(){return user;},get status(){return status;},
  async init(){if(!available||window.__TAURI_INTERNALS__)return;try{await connect();sdk.onAuthStateChanged(auth,watch);}catch{status='syncError';changed();}},
  async login(){if(window.__TAURI_INTERNALS__)throw Error('desktopAuth');await connect();await sdk.signInWithPopup(auth,new sdk.GoogleAuthProvider());},
  async logout(){clearTimeout(timer);unsubscribe?.();unsubscribe=null;await sdk.signOut(auth);user=null;status='';changed();},
  sync
 };
}
