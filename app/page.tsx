import AirdropCard from "@/components/AirdropCard";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center justify-center w-full p-8 mx-auto">
        <Image
          alt="Solana Logo"
          src="/solana-logo.png"
          width={100}
          height={100}
        />
        <div className="text-center pl-5 text-5xl font-extrabold">
          SOLANA
        </div>
      </div>
      
      <AirdropCard />
    </div>
  );
}
