import { auth } from "@/auth";
import Link from "next/link";
import { LogoutButton } from "./logout-button";

const HeaderAuth = async () => {
    const session = await auth();

    return (
        <div>
            {!session ? (
                <div className="flex gap-3 items-center sm:text-xl text-sm">
                    <Link href="login" className="border-2 border-white hover:border-gray-300 hover:text-gray-300 rounded-full sm:px-5 px-4 py-1 transition duration-300 ease-in-out">Log in</Link>
                </div>
            ) : (
                <div className="flex items-center gap-4 font-bold">
                    <LogoutButton />
                </div>
            )}
        </div>
    );
}
 
export default HeaderAuth;