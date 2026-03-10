import { useEffect, useState, useRef } from "react";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";

export default function CompliancePolicies(){

/* ================= STATES ================= */

const [policies,setPolicies]=useState([]);
const [courses,setCourses]=useState([]);

const [activeTab,setActiveTab]=useState("addPolicy");
const [loading,setLoading]=useState(false);

const tableRef = useRef();

const [editId,setEditId]=useState(null);

const [form,setForm]=useState({
name:"",
description:"",
courseIds:[],
orgWide:true,
locationIds:[],
autoAssignOnStaffOnboarding:true,
dueDays:30
});


/* ================= LOAD POLICIES ================= */

const loadPolicies = async () => {

try{

setLoading(true);

const res = await api.get("/compliance/policies");

setPolicies(res.data.policies || []);

}catch{
toastr.error("Failed to load policies");
}
finally{
setLoading(false);
}

};


/* ================= LOAD COURSES ================= */

const loadCourses = async () => {

try{

const res = await api.get("/courses?active=true");

setCourses(res.data.courses || []);

}catch{
toastr.error("Failed to load courses");
}

};


/* ================= INITIAL LOAD ================= */

useEffect(()=>{

loadPolicies();
loadCourses();

},[]);


/* ================= DATATABLE ================= */

useEffect(()=>{

if(activeTab==="policyList" && policies.length>0){

if($.fn.DataTable.isDataTable("#policyTable")){
$("#policyTable").DataTable().destroy();
}

setTimeout(()=>{

$("#policyTable").DataTable({
pageLength:5,
lengthMenu:[5,10,25]
});

},0);

}

},[activeTab,policies]);


/* ================= FORM CHANGE ================= */

const handleChange = (e) => {

const {name,value,type,checked} = e.target;

setForm(prev => ({
...prev,
[name]: type==="checkbox" ? checked : value
}));

};


/* ================= COURSE CHECKBOX ================= */

const toggleCourse = (courseId) => {

setForm(prev => {

let updated = [...prev.courseIds];

if(updated.includes(courseId)){
updated = updated.filter(id=>id!==courseId);
}else{
updated.push(courseId);
}

return {
...prev,
courseIds:updated
};

});

};


/* ================= SUBMIT ================= */

const handleSubmit = async (e) => {

e.preventDefault();

const payload = {
name:form.name,
description:form.description,
courseIds:form.courseIds,
orgWide:form.orgWide,
locationIds:[],
autoAssignOnStaffOnboarding:form.autoAssignOnStaffOnboarding,
dueDays:Number(form.dueDays)
};

try{

if(editId){

await api.put(`/compliance/policies/${editId}`,payload);

toastr.success("Policy updated");

}else{

await api.post("/compliance/policies",payload);

toastr.success("Policy created");

}

setEditId(null);

setForm({
name:"",
description:"",
courseIds:[],
orgWide:true,
locationIds:[],
autoAssignOnStaffOnboarding:true,
dueDays:30
});

loadPolicies();

setActiveTab("policyList");

}catch(err){

toastr.error(err.response?.data?.message || "Save failed");

}

};


/* ================= EDIT POLICY ================= */

const handleEdit = (policy) => {

setEditId(policy._id);

setForm({
name:policy.name || "",
description:policy.description || "",
courseIds:policy.courseIds?.map(c=>c._id) || [],
orgWide:policy.orgWide ?? true,
locationIds:policy.locationIds || [],
autoAssignOnStaffOnboarding:policy.autoAssignOnStaffOnboarding ?? true,
dueDays:policy.dueDays || 30
});

setActiveTab("addPolicy");

};


/* ================= UI ================= */

return(

<div className="mx-wd">

<div className="dash-tp">

<h1 className="wlc-tl">Compliance Policies</h1>

<p className="wlc-ms">
Create mandatory compliance training rules
</p>

</div>


<div className="pg-tabs">

<span
className={`pg-tb ${activeTab==="addPolicy"?"active-tab":""}`}
onClick={()=>setActiveTab("addPolicy")}
>
Add Policy
</span>

<span
className={`pg-tb ${activeTab==="policyList"?"active-tab":""}`}
onClick={()=>setActiveTab("policyList")}
>
Policy List
</span>

</div>


<div className="tab-content">

{/* ================= ADD POLICY ================= */}

{activeTab==="addPolicy" && (

<div className="tab-cnnt">

<div style={{maxWidth:"700px"}}>

<form onSubmit={handleSubmit}>

<div className="form-group">
<label>Policy Name</label>
<input
type="text"
name="name"
value={form.name}
onChange={handleChange}
required
/>
</div>


<div className="form-group">
<label>Description</label>
<textarea rows="5"
name="description"
value={form.description}
onChange={handleChange}
required
/>
</div>


{/* COURSE CHECKBOXES */}

<div className="form-group">

<label>Assign Courses</label>

<div style={{
border:"1px solid #ddd",
padding:"15px",
borderRadius:"6px",
maxHeight:"200px",
overflowY:"auto"
}}>

{courses.map(course=>(
<div key={course._id} style={{marginBottom:"8px"}}>

<label>

<input
type="checkbox"
checked={form.courseIds.includes(course._id)}
onChange={()=>toggleCourse(course._id)}
/>

{" "} {course.title}

</label>

</div>
))}

</div>

</div>


<div className="form-group">
<label>Due Days</label>
<input
type="number"
name="dueDays"
value={form.dueDays}
onChange={handleChange}
/>
</div>


<div className="form-group">

<label>

<input
type="checkbox"
name="orgWide"
checked={form.orgWide}
onChange={handleChange}
/>

 Apply Organization Wide

</label>

</div>


<div className="form-group">

<label>

<input
type="checkbox"
name="autoAssignOnStaffOnboarding"
checked={form.autoAssignOnStaffOnboarding}
onChange={handleChange}
/>

 Auto Assign On Staff Onboarding

</label>

</div>


<button className="snd-btn" type="submit">

{editId ? "Update Policy" : "Create Policy"}

</button>

</form>

</div>

</div>

)}


{/* ================= POLICY LIST ================= */}

{activeTab==="policyList" && (

<div className="ls-tbl">

{loading ? (

<p>Loading policies...</p>

) : (

<table id="policyTable" className="dataTable" ref={tableRef}>

<thead>
<tr>
<th>Name</th>
<th>Courses</th>
<th>Due Days</th>
<th>Org Wide</th>
<th>Action</th>
</tr>
</thead>

<tbody>

{policies.length===0 &&
<tr>
<td colSpan="5">No Policies Created</td>
</tr>
}

{policies.map(p=>(
<tr key={p._id}>

<td>{p.name}</td>

<td>
{p.courseIds?.map(c=>c.title).join(", ")}
</td>

<td>{p.dueDays}</td>

<td>{p.orgWide ? "Yes" : "No"}</td>

<td>

<button
className="logout-btn"
onClick={()=>handleEdit(p)}
>
<i className="fa fa-edit"></i>
</button>

</td>

</tr>
))}

</tbody>

</table>

)}

</div>

)}

</div>

</div>

);

}