(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const STORAGE_KEY = "meridianCareAppointments_v1";
  const DEMO_LOGIN = { username: "admin", password: "MeridianDemo24" };
  const today = new Date(); today.setHours(0,0,0,0);
  const isoDate = d => { const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; };
  const shiftDate = days => { const d=new Date(); d.setDate(d.getDate()+days); return isoDate(d); };
  const seed = [
    {id:"MC-261117-A7K2",name:"Amara Bennett",phone:"08031245678",email:"amara.bennett@example.test",department:"General Medicine",date:shiftDate(1),time:"09:00 AM",reason:"Routine health consultation.",status:"Pending",createdAt:new Date().toISOString()},
    {id:"MC-261117-B4P9",name:"Daniel Okafor",phone:"08059871234",email:"daniel.okafor@example.test",department:"Dental Services",date:shiftDate(2),time:"11:00 AM",reason:"Tooth sensitivity and routine check-up.",status:"Confirmed",createdAt:new Date().toISOString()},
    {id:"MC-261117-C8R1",name:"Zara Collins",phone:"07024567891",email:"",department:"Paediatrics",date:shiftDate(-2),time:"10:00 AM",reason:"Child wellness consultation.",status:"Completed",createdAt:new Date().toISOString()},
    {id:"MC-261117-D2M6",name:"Noah Adeyemi",phone:"08123450987",email:"noah.adeyemi@example.test",department:"Laboratory Services",date:shiftDate(4),time:"08:00 AM",reason:"Routine blood work request.",status:"Cancelled",createdAt:new Date().toISOString()},
    {id:"MC-261117-E5T3",name:"Ivy Morgan",phone:"09087654321",email:"ivy.morgan@example.test",department:"General Medicine",date:shiftDate(3),time:"02:00 PM",reason:"Follow-up consultation.",status:"Pending",createdAt:new Date().toISOString()},
    {id:"MC-261117-F9W8",name:"Ethan James",phone:"07011223344",email:"ethan.james@example.test",department:"Dental Services",date:shiftDate(5),time:"01:00 PM",reason:"Dental review.",status:"Confirmed",createdAt:new Date().toISOString()}
  ];
  let appointments = loadAppointments(), selectedId = null, toastTimer;
  function loadAppointments(){ try { const raw=localStorage.getItem(STORAGE_KEY); if(raw===null){localStorage.setItem(STORAGE_KEY,JSON.stringify(seed));return [...seed];} const data=JSON.parse(raw); return Array.isArray(data)?data:[]; } catch(e){ return [...seed]; } }
  function save(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(appointments));return true;}catch(e){showToast("Unable to save. Browser storage may be full.");return false;} }
  function showToast(message){const t=$("#toast");t.textContent=message;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2600);}
  function showView(view){
    const logged=sessionStorage.getItem("meridianStaffSession")==="yes";
    if(view==="dashboard"&&!logged)view="staff";
    $("#patientView").hidden=view!=="patient";
    $("#loginView").hidden=view!=="staff";
    $("#dashboardView").hidden=view!=="dashboard";
    const activeNav=view==="dashboard"?"staff":view;
    $$("[data-view]").forEach(b=>{
      const active=b.dataset.view===activeNav;
      b.classList.toggle("active",active);
      b.setAttribute("aria-pressed",String(active));
    });
    window.scrollTo(0,0);
    if(view==="dashboard")renderDashboard();
  }
  $$("[data-view]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();showView(el.dataset.view);}));
  $("#patientBookingNav").addEventListener("click",()=>{
    showView("patient");
    window.setTimeout(()=>$("#booking").scrollIntoView({behavior:"smooth",block:"start"}),50);
  });
  $("#headerBook").addEventListener("click",e=>{
    e.preventDefault();
    if($("#patientView").hidden)showView("patient");
    $("#booking").scrollIntoView({behavior:"smooth",block:"start"});
  });
  $("#year").textContent=new Date().getFullYear(); $("#dateFilter").value="";
  const dateInput=$('input[name="date"]'); dateInput.min=isoDate(today);
  $("#bookingForm").addEventListener("submit",e=>{
    e.preventDefault();const form=e.currentTarget;let valid=true;
    $$(".field",form).forEach(f=>{f.classList.remove("invalid");$(".error",f).textContent="";});
    const data=Object.fromEntries(new FormData(form).entries());
    const setError=(name,msg)=>{const input=form.elements[name],field=input.closest(".field");field.classList.add("invalid");$(".error",field).textContent=msg;valid=false;};
    if(!data.name.trim()||data.name.trim().length<2)setError("name","Enter the patient's full name.");
    const phone=data.phone.replace(/[\s()+-]/g,"");if(!/^\d{10,15}$/.test(phone))setError("phone","Enter a valid phone number (10–15 digits).");
    if(data.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email))setError("email","Enter a valid email address.");
    if(!data.department)setError("department","Please select a department.");
    if(!data.date)setError("date","Please choose a date.");else if(data.date<isoDate(today))setError("date","Past dates are not available.");
    if(!data.time)setError("time","Please select a preferred time.");
    if(!valid){$("#formError").textContent="Please review the highlighted fields.";return;}
    $("#formError").textContent="";
    const id=makeReference();const record={id,name:data.name.trim(),phone:data.phone.trim(),email:data.email.trim(),department:data.department,date:data.date,time:data.time,reason:data.reason.trim(),status:"Pending",createdAt:new Date().toISOString()};
    appointments.unshift(record);if(!save()){appointments.shift();return;}
    $("#successRef").textContent=id;$("#successDetails").innerHTML=`<b>${escapeHtml(record.name)}</b><br>${escapeHtml(record.department)} · ${formatDate(record.date)} at ${escapeHtml(record.time)}<br>${escapeHtml(record.phone)}`;
    form.hidden=true;$("#successPanel").hidden=false;showToast("Appointment request submitted.");
  });
  function makeReference(){let id;do{id="MC-"+isoDate(new Date()).replaceAll("-","").slice(2)+"-"+Math.random().toString(36).slice(2,6).toUpperCase();}while(appointments.some(a=>a.id===id));return id;}
  $("#copyRef").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("#successRef").textContent);showToast("Reference copied.");}catch(e){showToast("Reference: "+$("#successRef").textContent);}});
  $("#newBooking").addEventListener("click",()=>{$("#successPanel").hidden=true;$("#bookingForm").hidden=false;$("#bookingForm").reset();dateInput.min=isoDate(today);$("#booking").scrollIntoView({behavior:"smooth"});});
  $("#loginForm").addEventListener("submit",e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));if(d.username===DEMO_LOGIN.username&&d.password===DEMO_LOGIN.password){sessionStorage.setItem("meridianStaffSession","yes");$("#loginError").textContent="";e.currentTarget.reset();showView("dashboard");}else $("#loginError").textContent="The username or password is incorrect. Try the demo credentials shown below.";});
  $("#logoutBtn").addEventListener("click",()=>{sessionStorage.removeItem("meridianStaffSession");showView("staff");});
  $("#refreshBtn").addEventListener("click",()=>{appointments=loadAppointments();renderDashboard();showToast("Appointment list refreshed.");});
  ["searchInput","statusFilter","dateFilter"].forEach(id=>$("#"+id).addEventListener(id==="searchInput"?"input":"change",renderTable));
  $("#clearFilters").addEventListener("click",()=>{$("#searchInput").value="";$("#statusFilter").value="all";$("#dateFilter").value="";renderTable();});
  function renderDashboard(){const count=s=>appointments.filter(a=>a.status===s).length;$("#statTotal").textContent=appointments.length;$("#statPending").textContent=count("Pending");$("#statConfirmed").textContent=count("Confirmed");$("#statCancelled").textContent=count("Cancelled");$("#todayLabel").textContent=new Intl.DateTimeFormat("en",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).format(new Date());renderTable();}
  function renderTable(){const q=$("#searchInput").value.trim().toLowerCase(),status=$("#statusFilter").value,date=$("#dateFilter").value;const list=appointments.filter(a=>(!q||a.name.toLowerCase().includes(q)||a.id.toLowerCase().includes(q))&&(status==="all"||a.status===status)&&(!date||a.date===date)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));$("#recordCount").textContent=`${list.length} RECORD${list.length===1?"":"S"}`;$("#tableSummary").textContent=`Showing ${list.length} of ${appointments.length} appointments`;$("#emptyState").hidden=list.length!==0;$("#appointmentsBody").innerHTML=list.map(a=>`<tr><td><strong>${escapeHtml(a.name)}</strong><small>${escapeHtml(a.id)} · ${escapeHtml(a.phone)}</small></td><td>${escapeHtml(a.department)}</td><td>${formatDate(a.date)}</td><td>${escapeHtml(a.time)}</td><td><span class="status ${a.status.toLowerCase()}">${a.status}</span></td><td><button class="row-action" data-open="${escapeAttr(a.id)}">View details →</button></td></tr>`).join("");$$("[data-open]").forEach(b=>b.addEventListener("click",()=>openDetails(b.dataset.open)));}
  function openDetails(id){const a=appointments.find(x=>x.id===id);if(!a)return;selectedId=id;$("#modalContent").innerHTML=`<div class="detail-grid">${detail("Reference",a.id)}${detail("Current status",`<span class="status ${a.status.toLowerCase()}">${a.status}</span>`)}${detail("Patient name",a.name)}${detail("Phone number",a.phone)}${detail("Email address",a.email||"Not provided")}${detail("Department",a.department)}${detail("Appointment date",formatDate(a.date))}${detail("Preferred time",a.time)}<div class="detail-item wide"><small>REASON FOR APPOINTMENT</small><p>${escapeHtml(a.reason||"No reason provided.")}</p></div><div class="detail-item wide"><small>REQUEST RECEIVED</small><strong>${new Date(a.createdAt).toLocaleString()}</strong></div></div>`;
    const actions=$("#modalActions");actions.innerHTML="";if(a.status==="Pending"){actions.append(actionButton("Confirm appointment","action-confirm","Confirmed"),actionButton("Cancel request","action-cancel","Cancelled"));}else if(a.status==="Confirmed"){actions.append(actionButton("Mark as completed","action-complete","Completed"),actionButton("Cancel appointment","action-cancel","Cancelled"));}else{const note=document.createElement("span");note.style.cssText="font-size:10px;color:#879397";note.textContent="This appointment is "+a.status.toLowerCase()+". No further status actions are available.";actions.append(note);}
    $("#detailModal").hidden=false;
  }
  function detail(label,value){return `<div class="detail-item"><small>${label.toUpperCase()}</small><strong>${value}</strong></div>`;}
  function actionButton(label,cls,status){const b=document.createElement("button");b.className=cls;b.textContent=label;b.addEventListener("click",()=>updateStatus(status));return b;}
  function updateStatus(status){const a=appointments.find(x=>x.id===selectedId);if(!a)return;a.status=status;if(save()){closeModal();renderDashboard();showToast(`Appointment ${status.toLowerCase()}.`);}}
  function closeModal(){$("#detailModal").hidden=true;selectedId=null;}
  $("#closeModal").addEventListener("click",closeModal);$("#detailModal").addEventListener("click",e=>{if(e.target.id==="detailModal")closeModal();});document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  function formatDate(s){if(!s)return "—";return new Date(s+"T12:00:00").toLocaleDateString("en",{day:"numeric",month:"short",year:"numeric"});}
  function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function escapeAttr(s){return escapeHtml(s).replace(/`/g,"&#96;");}
  showView("patient");
})();