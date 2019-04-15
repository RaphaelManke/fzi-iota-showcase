function formatIota(iotas: number) {
  if (iotas > 1000000000) return (iotas / 1000000000).toFixed(2) + " Gi";
  if (iotas > 1000000) return (iotas / 1000000).toFixed(2) + " Mi";
  if (iotas > 1000) return (iotas / 1000).toFixed(2) + " Ki";
  return iotas + " i";
}

export { formatIota };
