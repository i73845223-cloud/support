import Link from "next/link";
import HeaderAuth from "./header-auth";
import HeaderNav from "./header-nav";

const Header = () => {
    return (
        <header className="fixed flex justify-between items-center sm:px-8 px-3 py-3 text-xl border-b-2 border-red-600 w-full bg-black z-[20]">
            <Link href="/">
                <img src="logo.png" alt="logo" className="w-[80px] sm:w-[120px]" rel="preload" />
            </Link>
            <HeaderNav />
            <HeaderAuth />
        </header>
    );
}
 
export default Header;