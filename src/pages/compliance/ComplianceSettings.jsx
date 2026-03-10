import { useEffect, useState } from "react";
import api from "../../api/api";
import toastr from "toastr";

export default function ComplianceSettings(){

/* ================= STATES ================= */

const [settings,setSettings]=useState({
autoAssignOnStaffOnboarding:false,
defaultDueDays:30,
certificateAlertDays:[30,14,7,1],
notificationChannels:{
email:true,
inApp:true
}
});

const [activeTab,setActiveTab]=useState("settings");

/* ================= ALERT OPTIONS ================= */

const alertOptions=[60,30,14,7,1];

/* ================= LOAD SETTINGS ================= */

const loadSettings=async()=>{

try{

const res=await api.get("/compliance/settings");

setSettings({
autoAssignOnStaffOnboarding:res.data?.autoAssignOnStaffOnboarding ?? false,
defaultDueDays:res.data?.defaultDueDays ?? 30,
certificateAlertDays:res.data?.certificateAlertDays ?? [30,14,7,1],
notificationChannels:res.data?.notificationChannels ?? {
email:true,
inApp:true
}
});

}catch(err){

toastr.error("Failed to load settings");

}

};

useEffect(()=>{

loadSettings();

},[]);

/* ================= FORM CHANGE ================= */

const handleChange=(e)=>{

const {name,value,type,checked}=e.target;

setSettings(prev=>({

...prev,
[name]:type==="checkbox" ? checked : value

}));

};

/* ================= ALERT DAY TOGGLE ================= */

const toggleAlertDay=(day)=>{

setSettings(prev=>{

let days=[...prev.certificateAlertDays];

if(days.includes(day)){

days=days.filter(d=>d!==day);

}else{

days.push(day);

}

days.sort((a,b)=>b-a);

return{
...prev,
certificateAlertDays:days
};

});

};

/* ================= CHANNEL TOGGLE ================= */

const toggleChannel=(channel)=>{

setSettings(prev=>({

...prev,
notificationChannels:{
...prev.notificationChannels,
[channel]:!prev.notificationChannels[channel]
}

}));

};

/* ================= SAVE ================= */

const saveSettings=async()=>{

try{

await api.put("/compliance/settings",settings);

toastr.success("Compliance settings updated");

}catch(err){

toastr.error("Failed to update settings");

}

};

/* ================= UI ================= */

return(

<div className="mx-wd">

<div className="dash-tp">

<h1 className="wlc-tl">Compliance Settings</h1>

<p className="wlc-ms">
Configure compliance rules for your organization
</p>

</div>

<div className="pg-tabs">

<span
className={`pg-tb ${activeTab==="settings"?"active-tab":""}`}
onClick={()=>setActiveTab("settings")}
>
Settings
</span>

</div>

<div className="tab-content">

{activeTab==="settings" && (

<div className="tab-cnnt">

<div style={{maxWidth:"600px"}}>

{/* AUTO ASSIGN */}

<div className="form-group">
<div style={{
display:"grid",
gridTemplateColumns:"repeat(1,1fr)",
gap:"10px",
marginTop:"10px"
}}>
<label style={{
border:"1px solid #ddd",
padding:"10px",
borderRadius:"6px",
cursor:"pointer",
display:"flex",
alignItems:"center",
gap:"8px"}}>
    <input
type="checkbox"
name="autoAssignOnStaffOnboarding"
checked={settings.autoAssignOnStaffOnboarding}
onChange={handleChange}
/>
Auto Assign Compliance Courses On Staff Onboarding

</label>
</div>
</div>

{/* DEFAULT DUE DAYS */}

<div className="form-group">

<label>Default Due Days</label>

<input
type="number"
name="defaultDueDays"
value={settings.defaultDueDays}
onChange={handleChange}
/>

</div>

{/* CERTIFICATE ALERT DAYS */}

<div className="form-group">

<label>Certificate Expiry Alerts</label>

<div style={{
display:"grid",
gridTemplateColumns:"repeat(3,1fr)",
gap:"10px",
marginTop:"10px"
}}>

{alertOptions.map(day=>(

<label
key={day}
style={{
border:"1px solid #ddd",
padding:"10px",
borderRadius:"6px",
cursor:"pointer",
display:"flex",
alignItems:"center",
gap:"8px"
}}
>

<input
type="checkbox"
checked={settings.certificateAlertDays.includes(day)}
onChange={()=>toggleAlertDay(day)}
/>

{day} Days Before

</label>

))}

</div>

</div>

{/* NOTIFICATION CHANNELS */}

<div className="form-group">

<label>Notification Channels</label>

<div style={{display:"flex",gap:"20px",marginTop:"10px"}}>

<label>

<input
type="checkbox"
checked={settings.notificationChannels.email}
onChange={()=>toggleChannel("email")}
/>

 Email

</label>

<label>

<input
type="checkbox"
checked={settings.notificationChannels.inApp}
onChange={()=>toggleChannel("inApp")}
/>

 In App

</label>

</div>

</div>

<button className="snd-btn" onClick={saveSettings}>
Save Settings
</button>

</div>

</div>

)}

</div>

</div>

);

}