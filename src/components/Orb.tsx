function Orb() {
  return (
    <div className="orb-scene" aria-hidden="true">
      <div className="orb-halo orb-halo--outer" />
      <div className="orb-halo orb-halo--mid" />
      <div className="orb-core">
        <div className="orb-core__glow" />
        <div className="orb-core__ring orb-core__ring--one" />
        <div className="orb-core__ring orb-core__ring--two" />
        <div className="orb-core__pulse" />
      </div>
      <span className="orb-particle orb-particle--one" />
      <span className="orb-particle orb-particle--two" />
      <span className="orb-particle orb-particle--three" />
      <span className="orb-particle orb-particle--four" />
    </div>
  );
}

export default Orb;
