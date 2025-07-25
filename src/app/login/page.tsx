import NavBar from "@/components/NavBar";
import LoginForm from "../../components/LoginForm";
import Footer from "@/components/Footer";
import NavBarNoAuth from "@/components/NavBarNoAuth";

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