import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

export default function Home() {
  return (
    <>
      {/* Animated background orbs — purely decorative */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="page">
        <Navbar />
        <Hero />
      </div>
    </>
  );
}
