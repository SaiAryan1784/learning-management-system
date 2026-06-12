
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import "toastr/build/toastr.min.css";
import toastr from "toastr";
import './css/style.css'
import "./utils/datatables-setup";
import { BrandProvider } from './contexts/BrandContext';

toastr.options = {
  positionClass: "toast-top-right",
  timeOut: 3000,
  closeButton: true,
  progressBar: true,
};
ReactDOM.createRoot(document.getElementById('root')).render(

  // <React.StrictMode>
    <BrandProvider>
      <App />
    </BrandProvider>
  // </React.StrictMode>
)
