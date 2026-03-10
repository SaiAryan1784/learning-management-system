import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/api";
import toastr from "toastr";
import $ from "jquery";
import "datatables.net";

import {
DndContext,
closestCenter,
PointerSensor,
useSensor,
useSensors
} from "@dnd-kit/core";

import {
SortableContext,
useSortable,
verticalListSortingStrategy
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const ReactQuill = React.lazy(() => import("react-quill"));
import "react-quill/dist/quill.snow.css";

/* ================= SORTABLE ITEM (MOVED OUTSIDE) ================= */

function SortableItem({ id, renderField }) {

const {
attributes,
listeners,
setNodeRef,
setActivatorNodeRef,
transform,
transition
} = useSortable({ id });

const style = {
transform: CSS.Transform.toString(transform),
transition,
border: "1px solid #ddd",
padding: "15px",
marginBottom: "15px",
background: "#fff"
};

return (
<div ref={setNodeRef} style={style}>

<div
ref={setActivatorNodeRef}
{...attributes}
{...listeners}
style={{
cursor: "grab",
background: "#f5f5f5",
padding: "6px 10px",
marginBottom: "10px",
display: "inline-block",
borderRadius: "4px",
fontSize: "13px"
}}
>
☰ Drag Field
</div>

{renderField(id)}

</div>
);

}

/* ================= MAIN COMPONENT ================= */

export default function ModuleLessons(){

const { courseId, moduleId } = useParams();
const tableRef = useRef();

/* ================= STATES ================= */

const [lessons,setLessons]=useState([]);
const [editId,setEditId]=useState(null);

const [form,setForm]=useState({
title:"",
type:"video",
sourceType:"external_url",
contentUrl:"",
textContent:"",
order:1
});

const [uploading,setUploading]=useState(false);
const [uploadProgress,setUploadProgress]=useState(0);
const [uploadedFileName,setUploadedFileName]=useState("");

const [activeTab,setActiveTab]=useState("addLesson");
const [loading,setLoading]=useState(false);

/* ================= DRAG SENSOR ================= */

const sensors = useSensors(
useSensor(PointerSensor,{
activationConstraint:{ distance:8 }
})
);

/* ================= BUILDER ================= */

const sidebarFields=[
{id:"title",label:"Lesson Title"},
{id:"type",label:"Lesson Type"},
{id:"sourceType",label:"Source Type"},
{id:"contentUrl",label:"Content URL"},
{id:"file",label:"Upload File"},
{id:"textContent",label:"Text Editor"},
{id:"order",label:"Display Order"}
];

const [canvasFields,setCanvasFields]=useState([]);

function addField(id){
if(canvasFields.includes(id)) return;
setCanvasFields([...canvasFields,id]);
}

/* ================= LOAD LESSONS ================= */

const loadLessons=async()=>{
try{
setLoading(true);

const res=await api.get(
`/courses/${courseId}/modules/${moduleId}/lessons?active=true&page=1&limit=100`
);

setLessons(res.data.lessons || []);

}catch(err){
toastr.error("Failed to load lessons");
}
finally{
setLoading(false);
}
};

useEffect(()=>{ loadLessons(); },[]);

/* ================= DATATABLE ================= */

useEffect(()=>{

if(activeTab==="lessonList" && lessons.length>0 && !loading){

if($.fn.DataTable.isDataTable("#lessonsTable")){
$("#lessonsTable").DataTable().destroy();
}

setTimeout(()=>{
$("#lessonsTable").DataTable({
pageLength:5,
lengthMenu:[5,10,25]
});
},0);

}

},[activeTab,lessons,loading]);

/* ================= FORM CHANGE ================= */

const handleChange=(e)=>{
const {name,value}=e.target;
setForm(prev=>({...prev,[name]:value}));
};

/* ================= FILE UPLOAD ================= */

const uploadFile=async(file)=>{

if(!file) return;

try{

setUploading(true);
setUploadProgress(0);

const formData=new FormData();
formData.append("file",file);

const uploadRes=await api.post(
`/uploads/lessons/file/${form.type}`,
formData,
{
headers:{ "Content-Type":"multipart/form-data" },
onUploadProgress:(event)=>{
if(event.lengthComputable){
const percent=Math.round((event.loaded/event.total)*100);
setUploadProgress(percent);
}
}
}
);

setUploading(false);
setUploadedFileName(file.name);

setForm(prev=>({
...prev,
contentUrl:uploadRes.data.fileUrl,
sourceType:"file"
}));

toastr.success("Upload successful");

}catch(err){

setUploading(false);
toastr.error("Upload error");

}

};

/* ================= YOUTUBE EMBED ================= */

const getYouTubeEmbed=(url)=>{
if(!url) return "";
const reg=/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
const match=url.match(reg);
return match ? `https://www.youtube.com/embed/${match[1]}` : "";
};

/* ================= SUBMIT ================= */

const handleSubmit=async(e)=>{

e.preventDefault();

if(uploading) return toastr.warning("Wait for upload");

const payload={
title:form.title,
type:form.type,
order:Number(form.order),
sourceType:form.sourceType
};

if(form.type==="text"){
payload.contentText=form.textContent;
}else{
payload.contentUrl=form.contentUrl;
}

try{

if(editId){

await api.put(
`/courses/${courseId}/modules/${moduleId}/lessons/${editId}`,
payload
);

toastr.success("Lesson updated");

}else{

await api.post(
`/courses/${courseId}/modules/${moduleId}/lessons`,
payload
);

toastr.success("Lesson added");

}

setEditId(null);

setForm({
title:"",
type:"video",
sourceType:"external_url",
contentUrl:"",
textContent:"",
order:1
});

setCanvasFields([]);

loadLessons();
setActiveTab("lessonList");

}catch(err){

console.error(err.response?.data || err);
toastr.error(err.response?.data?.message || "Save failed");

}

};

/* ================= EDIT ================= */

const handleEdit = (lesson) => {

setEditId(lesson._id);

const newForm = {
title: lesson.title || "",
type: lesson.type || "video",
sourceType: lesson.sourceType || "external_url",
contentUrl: lesson.contentUrl || "",
textContent: lesson.contentText || "",
order: lesson.order || 1
};

setForm(newForm);

const fields=["title","type","sourceType"];

if (lesson.type==="text") fields.push("textContent");
else fields.push("contentUrl");

fields.push("order");

if (lesson.sourceType==="file") fields.push("file");

setCanvasFields(fields);

setActiveTab("addLesson");

};

/* ================= DRAG ================= */

function handleDragEnd(event){

const {active,over}=event;

if(!over) return;

if(active.id!==over.id){

const oldIndex=canvasFields.indexOf(active.id);
const newIndex=canvasFields.indexOf(over.id);

const items=[...canvasFields];

items.splice(oldIndex,1);
items.splice(newIndex,0,active.id);

setCanvasFields(items);

}

}

/* ================= FIELD RENDER ================= */

function renderField(id){

switch(id){

case "title":
return(
<div className="form-group">
<label>Lesson Title</label>
<input type="text" name="title" value={form.title} onChange={handleChange}/>
</div>
);

case "type":
return(
<div className="form-group">
<label>Lesson Type</label>
<select name="type" value={form.type} onChange={handleChange}>
<option value="video">Video</option>
<option value="pdf">PDF</option>
<option value="image">Image</option>
<option value="text">Text</option>
</select>
</div>
);

case "sourceType":
return(
<div className="form-group">
<label>Source Type</label>
<select name="sourceType" value={form.sourceType} onChange={handleChange}>
<option value="external_url">External URL</option>
<option value="file">Upload File</option>
</select>
</div>
);

case "contentUrl":
return(
<div className="form-group">
<label>Content URL</label>
<input type="text" name="contentUrl" value={form.contentUrl} onChange={handleChange}/>
</div>
);

case "file":
return(
<div className="form-group">

<label>Upload File</label>

<div
className="file-drop-area"
onDragOver={(e)=>e.preventDefault()}
onDrop={(e)=>{
e.preventDefault();
const file = e.dataTransfer.files[0];
if(file) uploadFile(file);
}}
>

<input
type="file"
id="lessonFileUpload"
style={{display:"none"}}
onChange={(e)=>uploadFile(e.target.files[0])}
/>

<div
className="upload-ui"
onClick={()=>document.getElementById("lessonFileUpload").click()}
>

<i className="fa-solid fa-cloud-arrow-up upload-icon"></i>

<p className="upload-title">
Drag & Drop file here
</p>

<p className="upload-sub">
or click to browse
</p>

{uploadedFileName && (
<div className="uploaded-file">
<i className="fa-solid fa-file"></i>
<span>{uploadedFileName}</span>
</div>
)}

{uploading && (
<div className="upload-progress">
<div
className="upload-progress-bar"
style={{width:`${uploadProgress}%`}}
></div>
</div>
)}

</div>

</div>

</div>
);

case "textContent":
return(
<div className="form-group">
<label>Lesson Content</label>
<Suspense fallback={<p>Loading editor...</p>}>
<ReactQuill
value={form.textContent}
onChange={(value)=>setForm(prev=>({...prev,textContent:value}))}
/>
</Suspense>
</div>
);

case "order":
return(
<div className="form-group">
<label>Display Order</label>
<input type="number" name="order" value={form.order} onChange={handleChange}/>
</div>
);

default:
return null;

}

}

/* ================= UI ================= */

return(

<div className="mx-wd">

<div className="dash-tp">
<h1 className="wlc-tl">LESSON</h1>
<p className="wlc-ms">Please add your lesson's and take a look at lessons.</p>
</div>

<div className="pg-tabs">

<span
className={`pg-tb ${activeTab==="addLesson"?"active-tab":""}`}
onClick={()=>setActiveTab("addLesson")}
>
Add Lesson
</span>

<span
className={`pg-tb ${activeTab==="lessonList"?"active-tab":""}`}
onClick={()=>setActiveTab("lessonList")}
>
Lesson List
</span>

</div>

<div className="tab-content">

{activeTab==="addLesson" && (

<div className="tab-cnnt">

<div style={{display:"flex",gap:"30px"}}>

<div style={{flex:1,border:"1px solid #ddd",padding:"20px 20px 58px 20px",position:"relative",borderRadius:"8px"}}>

<form onSubmit={handleSubmit}>

<DndContext
sensors={sensors}
collisionDetection={closestCenter}
onDragEnd={handleDragEnd}
>

<SortableContext
items={canvasFields}
strategy={verticalListSortingStrategy}
>

{canvasFields.map(id=>(
<SortableItem
key={id}
id={id}
renderField={renderField}
/>
))}

</SortableContext>

</DndContext>

<button type="submit" className="snd-btn" disabled={uploading}
style={{position:"absolute",bottom:"20px",left:"0",right:"0",margin:"0 auto",display:"table"}}
>
{editId ? "Update Lesson" : "Create Lesson"}
</button>

</form>

</div>

<div style={{width:"250px",border:"1px solid #ddd",padding:"15px",borderRadius:"8px"}}>
<h4 style={{fontSize:"12px",fontWeight:"500",marginBottom:"10px"}}>
Please click on below options to add lesson
</h4>

{sidebarFields.map(field=>(
<div
className="les-typ"
key={field.id}
onClick={()=>addField(field.id)}
style={{
padding:"10px",
border:"1px solid #ccc",
marginBottom:"10px",
cursor:"pointer",
borderRadius:"8px",
display:"flex",
alignItems:"center",
gap:"10px",
fontSize:"14px"
}}
>
<i className="fa-solid fa-grip-vertical"></i> {field.label}
</div>
))}

</div>

</div>

</div>
)}

{/* LESSON LIST */}

{activeTab==="lessonList" && (

<div className="ls-tbl">

{loading ? (
<p>Loading lessons...</p>
) : (

<table id="lessonsTable" className="dataTable" ref={tableRef}>

<thead>
<tr>
<th>Title</th>
<th>Type</th>
<th>Preview</th>
<th>Order</th>
<th>Action</th>
</tr>
</thead>

<tbody>

{lessons.length===0 &&
<tr><td colSpan="5">No Lessons created</td></tr>
}

{lessons.map((lesson)=>(
<tr key={lesson._id}>

<td>{lesson.title}</td>
<td>{lesson.type}</td>

<td>

{lesson.type==="video" && lesson.sourceType==="external_url" ? (
<iframe width="200" height="120" src={getYouTubeEmbed(lesson.contentUrl)} />
) : lesson.type==="video" ? (
<video width="200" controls>
<source src={lesson.contentUrl}/>
</video>
) : lesson.type==="image" ? (
<img src={lesson.contentUrl} width="150" alt=""/>
) : lesson.type==="pdf" ? (
<a href={lesson.contentUrl} target="_blank" rel="noreferrer">
View PDF
</a>
) : (
<div dangerouslySetInnerHTML={{__html:lesson.contentText}} />
)}

</td>

<td>{lesson.order}</td>

<td>
<button
className="logout-btn"
onClick={()=>handleEdit(lesson)}
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