export function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return (
    error?.name === 'ChunkLoadError' ||
    msg.includes('Loading chunk') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('ChunkLoadError')
  );
}

export function chunkReloadKey(pathname = '') {
  return `chunk-reload:${pathname || '/'}`;
}

export function hardReloadForStaleChunk() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.set('_cb', String(Date.now()));
  window.location.replace(url.toString());
}

export function reloadOnceForStaleChunk() {
  if (typeof window === 'undefined') return false;
  const key = chunkReloadKey(window.location.pathname);
  if (sessionStorage.getItem(key)) return false;
  sessionStorage.setItem(key, '1');
  hardReloadForStaleChunk();
  return true;
}

/** Inline script — runs before React chunks load (no imports). */
export const CHUNK_RECOVERY_INLINE_SCRIPT = `(function(){
  function isChunkErr(msg){
    return /Loading chunk|ChunkLoadError|Failed to fetch dynamically imported module/.test(msg||'');
  }
  function hardReload(){
    var u=new URL(location.href);
    u.searchParams.set('_cb',String(Date.now()));
    location.replace(u.toString());
  }
  function reloadOnce(){
    var key='chunk-reload:'+location.pathname;
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,'1');
    hardReload();
  }
  window.__geHardReload=hardReload;
  window.addEventListener('error',function(e){
    if(isChunkErr(e&&e.message))reloadOnce();
  });
  window.addEventListener('unhandledrejection',function(e){
    var msg=(e.reason&&e.reason.message)||String(e.reason||'');
    if(isChunkErr(msg)){e.preventDefault();reloadOnce();}
  });
})();`;

/** Redirect to login before React if ge_admin_token is missing (works when JS chunks fail). */
export const CUSTOMER_DASHBOARD_AUTH_INLINE_SCRIPT = `(function(){
  try{
    var key='ge_admin_token';
    var token=localStorage.getItem(key);
    if(token&&String(token).trim())return;
    if(location.pathname.indexOf('customer-dashboard-login')!==-1)return;
    location.replace('/customer-dashboard-login');
  }catch(_){}
})();`;
