const url = 'https://hizrvkxubfiobjhrbmcn.supabase.co/rest/v1/';
const apikey = 'sb_publishable_EbSPC5UDSZbUwt7_kZw0yg_BoczEwoM';

fetch(url, {
  method: 'GET',
  headers: {
    'apikey': apikey,
    'Accept': 'application/openapi+json'
  }
}).then(res => res.json()).then(data => {
  console.log(Object.keys(data.definitions || data.components.schemas));
  const orphans = data.definitions?.orphans || data.components?.schemas?.orphans;
  console.log('Orphans schema:', orphans);
}).catch(console.error);
