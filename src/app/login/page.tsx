import NavBar from "@/components/bars/NavBar";
import LoginForm from "../../components/forms/LoginForm";
import Footer from "@/components/Footer";
import NavBarNoAuth from "@/components/bars/NavBarNoAuth";

export default function Login() {
    return (
        <>
            <div className="min-h-screen flex flex-col">
                <NavBarNoAuth />
                <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#E6F2FF] to-[#F4F8FB] overflow-hidden">
                    <LoginForm />
                </div>
            </div>
            <Footer />
        </>
    );
}   