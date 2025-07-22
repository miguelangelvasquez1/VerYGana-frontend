import NavBar from "@/components/NavBar";
import LoginForm from "../../components/LoginForm";

export default function Login() {
    return (
        <div className="min-h-screen flex flex-col">
            <NavBar />
            <div className="flex-1 flex items-center justify-center bg-gradient overflow-hidden">
                <LoginForm />
            </div>
        </div>
    );
}