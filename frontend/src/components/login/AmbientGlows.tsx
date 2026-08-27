export function AmbientGlows() {
  return (
    <>
      <div
        aria-hidden
        className="drift absolute -top-32 left-[12%] h-[360px] w-[360px] rounded-full bg-accent/25 blur-[100px]"
      />
      <div
        aria-hidden
        className="drift-slow absolute -bottom-36 right-[8%] h-[380px] w-[380px] rounded-full bg-[#82a9ff]/20 blur-[110px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:52px_52px]"
      />
    </>
  );
}
