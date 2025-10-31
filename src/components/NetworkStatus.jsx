import { Wifi, WifiOff } from "lucide-react";
import { useNetwork } from "../context/NetworkContext";

const NetworkStatus = () => {
  const { isOnline } = useNetwork();

  return (
    <div className="network-status">
      {isOnline ? (
        <Wifi size={60} className="text-gray-300" />
      ) : (
        <WifiOff size={60} className="text-red-300" />
      )}
    </div>
  );
};

export default NetworkStatus;
