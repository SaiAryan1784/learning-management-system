import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AOS from "aos";
import "aos/dist/aos.css";
export default function Admin() {
  const { isSuperAdmin, access } = useAuth();
  const isOwner = !isSuperAdmin && access?.orgWide;
  const isStaff = !isSuperAdmin && !access?.orgWide;
AOS.init({
  duration: 800,
  once: true,
});
  return (
    <div className="mx-wd">
      {/* Super Admin */}
      {isSuperAdmin && (
        <>
        <div className="dash-tp">
          <h1 className="wlc-tl">Welcome, Super Admin!</h1>
          <p className="wlc-ms">Glad to see you again. Take a look at the latest platform activity and user updates below.</p>
        </div>
        <div className="row">
          <div className="col-md-3 col-12">
            <Link to="/dashboard/modules" className="datcard">
              <div className="fplogo">
                <i className="fa-solid fa-business-time fa-2x mn-ic" data-aos="fade-down"></i>
                <h2 className="mod-tl">ADD MODULES</h2>
                <p>Add modules for your business.</p>
                <div className="go-corner">
                </div>
              </div>
            </Link>
          </div>
           <div className="col-md-3 col-12">
              <Link to="/dashboard/locations" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-location-dot fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl">VIEW LOCATION</h2>
                  <p>View location for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-3 col-12">
              <Link to="/dashboard/roles" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-chalkboard-user fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl">VIEW ROLES</h2>
                  <p>View roles for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-3 col-12">
              <Link to="/dashboard/staff" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-person-chalkboard fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl" data-aos="fade-in">ADD STAFF</h2>
                  <p>View staff for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-3 col-12">
              <Link to="/dashboard/course-categories" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-book-open-reader fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl">VIEW COURSES CATEGORY</h2>
                  <p>View course category for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-3 col-12">
              <Link to="/dashboard/courses" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-book fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl">VIEW COURSES</h2>
                  <p>View courses for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Owner Only */}
      {isOwner && (
        <>
        <div className="dash-tp">
           <h1 className="wlc-tl">Welcome, Admin!</h1>
          <p className="wlc-ms">Glad to see you again. Take a look at the your business.</p>
        </div>
        <div className="row">
            <div className="col-md-3 col-12">
              <Link to="/dashboard/locations" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-location-dot fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl">ADD LOCATION</h2>
                  <p>Add location for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-3 col-12">
              <Link to="/dashboard/roles" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-chalkboard-user fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl">ADD ROLES</h2>
                  <p>Add roles for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-3 col-12">
              <Link to="/dashboard/staff" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-person-chalkboard fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl" data-aos="fade-in">ADD STAFF</h2>
                  <p>Add staff for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-3 col-12">
              <Link to="/dashboard/course-categories" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-book-open-reader fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl">ADD COURSES CATEGORY</h2>
                  <p>Add course category for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-3 col-12">
              <Link to="/dashboard/courses" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-book fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl">ADD COURSES</h2>
                  <p>Add courses for your business.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
      {/* STAFF DASHBOARD */}
      {isStaff && (
        <>
          <div className="dash-tp">
            <h1 className="wlc-tl">Welcome!</h1>
            <p className="wlc-ms">
              View your assigned courses.
            </p>
          </div>
          <div className="row">
            <div className="col-md-3 col-12">
              <Link to="/dashboard/my-courses" className="datcard">
                <div className="fplogo">
                  <i className="fa-solid fa-book fa-2x mn-ic" data-aos="fade-down"></i>
                  <h2 className="mod-tl">ASSIGNED COURSES</h2>
                  <p>Please review the assigned courses.</p>
                  <div className="go-corner">
                  </div>
                </div>
              </Link>
            </div>
          </div>
          {/* <div className="crd-wp">
            <div className="featuredPropBox">
              <ul>
                <li>
                  <Link to="/dashboard/my-courses" className="crd-lnk">
                    <div className="fplogo">
                      <i className="fa-solid fa-book fa-2x mn-ic"></i>
                      <h2 className="mod-tl">MY COURSES</h2>
                    </div>
                    <div className="fptext">
                      <i className="fa-solid fa-book mn-ic"></i>
                      <p>View your assigned courses</p>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
          </div> */}
        </>
      )}
    </div>
  );
}
