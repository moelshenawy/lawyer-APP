import Navbar from "@/components/Navbar";
import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center ">
        <div className="w-full max-w-md bg-white  rounded-2xl ">
          <Outlet />
        </div>
      </div>
    </>
  );
}
