
document.addEventListener('DOMContentLoaded', ()=>{
  const input=document.getElementById('file');
  const preview=document.getElementById('preview');
  const sendBtn=document.getElementById('sendBtn');
  let fileData=null;

  input.addEventListener('change', async ()=>{
    const f=input.files[0];
    if(!f) return;
    const buf=await f.arrayBuffer();
    const wb=XLSX.read(buf);
    const ws=wb.Sheets[wb.SheetNames[0]];
    const json=XLSX.utils.sheet_to_json(ws);
    fileData=json;
    preview.textContent=JSON.stringify(json,null,2);
    sendBtn.style.display='block';
  });

  sendBtn.addEventListener('click', async ()=>{
    const user=netlifyIdentity.currentUser();
    if(!user){ alert('Faça login primeiro.'); return; }
    const token=await user.jwt();

    const res=await fetch('/.netlify/functions/upload-postos',{
      method:'POST',
      headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+token},
      body:JSON.stringify({data:fileData})
    });
    alert(await res.text());
  });
});
