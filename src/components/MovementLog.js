import { Icon } from "@iconify/react";

const MovementLog = ({ movements, userMap }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Icon icon="material-symbols:history" className="w-5 h-5 text-blue-600" />
        Movement Log
      </h4>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {movements.length === 0 ? (
          <div className="text-gray-500 text-center py-8">No movements yet</div>
        ) : (
          movements.map((movement) => (
            <div
              key={movement.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    movement.type === "cash_in" ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <div>
                  <div className="font-medium">
                    {movement.type === "cash_in" ? "Cash In" : "Cash Out"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {movement.reason} • {userMap[movement.user_id] || movement.user_id}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-bold ${
                    movement.type === "cash_in" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {movement.type === "cash_in" ? "+" : "-"}GHS {Number(movement.amount).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(movement.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MovementLog; 