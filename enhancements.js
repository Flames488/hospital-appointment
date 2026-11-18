(() => {
  "use strict";
  const KEY="meridianCareAppointments_v1";
  const $=s=>document.querySelector(s);
  const read=()=>{try{return window.MERIDIAN_DATA?window.MERIDIAN_DATA.getAppointments():(JSON.parse(localStorage.getItem(KEY)||"[]"))}catch{return []}};
  const write=rows=>localStorage.setItem(KEY,JSON.stringify(rows));
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmtDate=s=>s?new Date(s+"T12:00:00").toLocaleDateString("en",{day:"numeric",month:"short",year:"numeric"}):"—";
  const dateISO=v=>{if(v instanceof Date)return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`;let s=String(v??"").trim();if(/^\d{4,5}(\.\d+)?$/.test(s)&&window.XLSX){const d=XLSX.SSF.parse_date_code(Number(s));if(d)return `${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`;}let d=new Date(s);return Number.isNaN(d.getTime())?s.slice(0,10):`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
  let currentPanel="appointments", selectedFile=null;
  function setPanel(name){
    currentPanel=name;
    ["appointments","patients","analytics","import","walkthrough"].forEach(n=>{const p=$("#panel-"+n);if(p)p.hidden=n!==name;});
    document.querySelectorAll("[data-panel]").forEach(b=>{b.classList.toggle("selected",b.dataset.panel===name);});
    const appt=$(".appointments-card"); if(appt)appt.hidden=name!=="appointments";
    if(name==="patients")renderPatients(); if(name==="analytics")renderAnalytics();
  }
  document.querySelectorAll("[data-panel]").forEach(b=>b.addEventListener("click",()=>setPanel(b.dataset.panel)));
  function renderPatients(){
    const q=($("#patientSearch")?.value||"").trim().toLowerCase(), rows=read();
    const profiles=new Map();
    rows.forEach(a=>{const key=(a.phone||a.name||a.id).toLowerCase().replace(/\s/g,"");if(!profiles.has(key))profiles.set(key,{...a,history:[]});const p=profiles.get(key);p.history.push(a);if(new Date(a.createdAt||0)>new Date(p.createdAt||0)){p.name=a.name||p.name;p.phone=a.phone||p.phone;p.email=a.email||p.email;p.createdAt=a.createdAt;}});
    const list=[...profiles.values()].filter(p=>[p.name,p.phone,p.email].join(" ").toLowerCase().includes(q));
    $("#patientDirectory").innerHTML=list.length?list.map((p,i)=>`<article class="patient-card"><div class="patient-card-head"><div class="patient-avatar">${esc((p.name||"P").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())}</div><div><h3>${esc(p.name)}</h3><p>${esc(p.phone||"No phone")} · ${esc(p.email||"No email")}</p></div><span class="history-count">${p.history.length} visit${p.history.length===1?"":"s"}</span></div><div class="patient-history"><b>APPOINTMENT HISTORY</b>${p.history.sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(a=>`<div class="history-row"><span>${fmtDate(a.date)} · ${esc(a.department)}</span><span class="status ${(a.status||"pending").toLowerCase()}">${esc(a.status||"Pending")}</span><small>${esc(a.id)}</small></div>`).join("")}</div></article>`).join(""):`<div class="empty-state"><span>♙</span><b>No patient profiles found</b><p>Try another name, phone number or email.</p></div>`;
  }
  $("#patientSearch")?.addEventListener("input",renderPatients);
  $("#patientSearchClear")?.addEventListener("click",()=>{$("#patientSearch").value="";renderPatients();});
  function renderBars(el,items,total){
    if(!items.length){el.innerHTML='<p class="chart-empty">No records available yet.</p>';return;}
    const max=Math.max(1,...items.map(x=>x.value));
    el.innerHTML=items.map(x=>`<div class="bar-row"><span title="${esc(x.label)}">${esc(x.label)}</span><div class="bar-track"><i style="width:${Math.max(3,x.value/max*100)}%"></i></div><b>${x.value}</b></div>`).join("");
  }
  function renderAnalytics(){
    const rows=read(), now=new Date(), months=[];
    for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1),key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;months.push({key,label:d.toLocaleDateString("en",{month:"short",year:"2-digit"}),value:rows.filter(a=>(a.date||"").slice(0,7)===key).length});}
    const deps=[...new Set(rows.map(a=>a.department||"Unspecified"))].map(label=>({label,value:rows.filter(a=>(a.department||"Unspecified")===label).length})).sort((a,b)=>b.value-a.value);
    renderBars($("#monthlyChart"),months,rows.length);renderBars($("#departmentChart"),deps,rows.length);
    const done=rows.filter(a=>a.status==="Completed").length, confirmed=rows.filter(a=>a.status==="Confirmed").length;
    $("#analyticsSummary").textContent=`${rows.length} total requests · ${confirmed} confirmed · ${done} completed · ${new Set(rows.map(a=>(a.phone||a.name||"").toLowerCase())).size} distinct patient profiles. Charts are calculated from the records currently stored in this browser.`;
  }
  const csvCell=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  function download(name,content,type="text/csv;charset=utf-8"){
    const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
  }
  $("#exportCsv")?.addEventListener("click",()=>{const rows=read(),cols=["id","name","phone","email","department","date","time","reason","status","createdAt"];download("meridian-appointments.csv",[cols.join(","),...rows.map(r=>cols.map(c=>csvCell(r[c])).join(","))].join("\r\n"));});
  $("#downloadTemplate")?.addEventListener("click",()=>download("meridian-import-template.csv","name,phone,email,department,date,time,reason,status\r\nAlex Morgan,08012345678,alex@example.com,General Medicine,2026-12-01,09:00 AM,Routine consultation,Pending\r\n"));
  $("#historyFile")?.addEventListener("change",e=>{selectedFile=e.target.files?.[0]||null;$("#selectedFile").textContent=selectedFile?selectedFile.name:"No file selected";$("#importFeedback").textContent="";});
  function parseCSV(text){
    const rows=[];let row=[],cell="",quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=!quoted;else if(c===","&&!quoted){row.push(cell);cell="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell="";}else cell+=c;}
    row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
    const headers=(rows.shift()||[]).map(h=>h.trim().toLowerCase().replace(/[\s_-]+/g,""));
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||"").trim()])));
  }
  function normalize(row){
    const pick=(...names)=>{for(const n of names){const v=row[n];if(v!==undefined&&v!==null&&String(v).trim()!=="")return String(v).trim();}return "";};
    const name=pick("name","patientname","fullname","patient");if(!name)return null;
    const date=dateISO(pick("date","appointmentdate","visitdate"));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return null;
    let status=pick("status","appointmentstatus")||"Pending";status=status[0].toUpperCase()+status.slice(1).toLowerCase();if(!["Pending","Confirmed","Cancelled","Completed"].includes(status))status="Pending";
    return {id:pick("id","reference","appointmentid","ref")||("MC-IMP-"+Math.random().toString(36).slice(2,8).toUpperCase()),name,phone:pick("phone","phonenumber","mobile","telephone"),email:pick("email","emailaddress"),department:pick("department","service","specialty")||"Unspecified",date,time:pick("time","appointmenttime","visittime")||"Not specified",reason:pick("reason","notes","description"),status,createdAt:new Date().toISOString()};
  }
  $("#importHistory")?.addEventListener("click",async()=>{
    const feedback=$("#importFeedback");if(!selectedFile){feedback.textContent="Choose a CSV or Excel file first.";feedback.className="import-feedback error-text";return;}
    try{
      const ext=selectedFile.name.split(".").pop().toLowerCase();let source;
      if(ext==="csv")source=parseCSV(await selectedFile.text());
      else if(["xlsx","xls"].includes(ext)&&window.XLSX){const wb=XLSX.read(await selectedFile.arrayBuffer(),{type:"array",cellDates:true});source=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""}).map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k.toLowerCase().replace(/[\s_-]+/g,""),v])));}
      else throw new Error("Excel import needs an internet connection to load the spreadsheet reader. Try CSV or reconnect and reload.");
      const incoming=source.map(normalize).filter(Boolean), existing=read(), ids=new Set(existing.map(a=>a.id)), fresh=incoming.filter(a=>!ids.has(a.id));
      if(!fresh.length)throw new Error("No new valid patient rows were found. Check that the file has a patient name column and unique references.");
      if(window.MERIDIAN_DATA) await window.MERIDIAN_DATA.importAppointments(fresh); else write([...fresh,...existing]);
      feedback.textContent=`Successfully imported ${fresh.length} record(s). ${incoming.length-fresh.length} duplicate reference(s) skipped.`;feedback.className="import-feedback success-text";selectedFile=null;$("#historyFile").value="";$("#selectedFile").textContent="No file selected";
    }catch(err){feedback.textContent=err.message||"Import failed. Check the file format and headings.";feedback.className="import-feedback error-text";}
  });
  const scriptText=`Welcome to Meridian Care, a hospital appointment and records workflow demonstration designed to connect the patient experience with day-to-day hospital operations.\n\nA patient chooses a department, enters their contact details and preferred appointment time, and submits a request. A unique reference is generated, while the request remains pending until staff review it.\n\nThe care team signs in to a central dashboard, searches requests, opens patient details and updates each appointment as pending, confirmed, cancelled or completed.\n\nPatient records bring contact information and appointment history together, making it easier to find returning patients and understand their previous visits.\n\nThe reporting view summarises monthly activity and department demand. Existing records can be imported from CSV or Excel to demonstrate historical data onboarding.\n\nThis prototype illustrates the workflow. A live hospital deployment would connect to secure server-side services, verified staff access, messaging and protected clinical records.`;
  $("#copyVideoScript")?.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(scriptText);$("#copyVideoScript").textContent="Copied";}catch{$("#copyVideoScript").textContent="Select script to copy";}});
  window.addEventListener("meridian:data-changed",()=>{
    if(currentPanel==="patients")renderPatients();
    if(currentPanel==="analytics")renderAnalytics();
  });
  // Ensure newly-added dashboard panels follow the existing view navigation.
  document.querySelectorAll('[data-view="dashboard"]').forEach(b=>b.addEventListener("click",()=>setPanel("appointments")));
  $("#refreshBtn")?.addEventListener("click",()=>{if(currentPanel==="patients")renderPatients();if(currentPanel==="analytics")renderAnalytics();});
  const dashboardObserver=new MutationObserver(()=>{if(!$("#dashboardView").hidden&&currentPanel==="patients")renderPatients();if(!$("#dashboardView").hidden&&currentPanel==="analytics")renderAnalytics();});
  dashboardObserver.observe($("#dashboardView"),{attributes:true,attributeFilter:["hidden"]});

  // Accessible collapsible workspace navigation on tablet and mobile.
  const workspaceToggle = $("#workspaceMenuToggle");
  const workspaceSidebar = $(".sidebar");
  const workspaceNav = $("#workspaceNav");
  if (workspaceToggle && workspaceSidebar && workspaceNav) {
    workspaceToggle.addEventListener("click", () => {
      const isOpen = workspaceSidebar.classList.toggle("menu-open");
      workspaceToggle.setAttribute("aria-expanded", String(isOpen));
      workspaceToggle.setAttribute("aria-label", isOpen ? "Close workspace menu" : "Open workspace menu");
    });
    workspaceNav.querySelectorAll("[data-panel]").forEach(item => {
      item.addEventListener("click", () => {
        workspaceSidebar.classList.remove("menu-open");
        workspaceToggle.setAttribute("aria-expanded", "false");
        workspaceToggle.setAttribute("aria-label", "Open workspace menu");
      });
    });
  }
})();