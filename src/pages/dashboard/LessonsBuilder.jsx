import { useState, Suspense } from "react";
import {
DndContext,
closestCenter
} from "@dnd-kit/core";

import {
SortableContext,
useSortable,
verticalListSortingStrategy
} from "@dnd-kit/sortable";

import {CSS} from "@dnd-kit/utilities";

const ReactQuill = React.lazy(()=>import("react-quill"));
import "react-quill/dist/quill.snow.css";

export default function LessonBuilder({
form,
setForm,
handleChange,
uploadFile,
handleSubmit,
uploading,
editId
}){

const sidebarFields=[
{ id:"title",label:"Lesson Title"},
{ id:"type",label:"Lesson Type"},
{ id:"sourceType",label:"Source Type"},
{ id:"contentUrl",label:"Content URL"},
{ id:"file",label:"File Upload"},
{ id:"textContent",label:"Text Editor"},
{ id:"order",label:"Display Order"}
];

const [canvasFields,setCanvasFields]=useState([]);

function addField(id){
if(canvasFields.includes(id)) return;
setCanvasFields([...canvasFields,id]);
}

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

function renderField(id){

switch(id){

case "title":
return(
<div className="form-group">
<label>Lesson Title</label>
<input
type="text"
name="title"
value={form.title}
onChange={handleChange}
/>
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
<input
type="text"
name="contentUrl"
value={form.contentUrl}
onChange={handleChange}
/>
</div>
);

case "file":
return(
<div className="form-group">
<label>Upload File</label>
<input
type="file"
onChange={(e)=>uploadFile(e.target.files[0])}
/>
</div>
);

case "textContent":
return(
<div className="form-group">
<label>Lesson Content</label>

<Suspense fallback={<p>Loading editor...</p>}>
<ReactQuill
value={form.textContent}
onChange={(value)=>setForm({...form,textContent:value})}
/>
</Suspense>

</div>
);

case "order":
return(
<div className="form-group">
<label>Display Order</label>
<input
type="number"
name="order"
value={form.order}
onChange={handleChange}
/>
</div>
);

default:
return null;

}

}

function SortableItem({id}){

const {attributes,listeners,setNodeRef,transform,transition}=useSortable({id});

const style={
transform:CSS.Transform.toString(transform),
transition,
border:"1px solid #ddd",
padding:"15px",
marginBottom:"15px",
background:"#fff"
};

return(
<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
{renderField(id)}
</div>
);
}

return(

<div style={{display:"flex",gap:"30px"}}>

<div style={{width:"250px",border:"1px solid #ddd",padding:"15px"}}>
<h4>Add Fields</h4>

{sidebarFields.map(field=>(
<div
key={field.id}
className="drag-item"
onClick={()=>addField(field.id)}
style={{
padding:"10px",
border:"1px solid #ccc",
marginBottom:"10px",
cursor:"pointer"
}}
>
{field.label}
</div>
))}

</div>


<div style={{flex:1,border:"2px dashed #ccc",padding:"20px"}}>

<form onSubmit={handleSubmit}>

<DndContext
collisionDetection={closestCenter}
onDragEnd={handleDragEnd}
>

<SortableContext
items={canvasFields}
strategy={verticalListSortingStrategy}
>

{canvasFields.map(id=>(
<SortableItem key={id} id={id}/>
))}

</SortableContext>

</DndContext>

<button
type="submit"
className="snd-btn"
disabled={uploading}
>
{editId ? "Update Lesson" : "Create Lesson"}
</button>

</form>

</div>

</div>

);

}