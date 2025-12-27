let io = null
// tạo  socket io inst
export const initSocket = (socketIoInstance) => {
    io = socketIoInstance;
    console.log("Socket initialized.");
}

export const getIO = () =>{
    if(!io){
        throw new Error('Socket not initialized.');
    }
}
// Gửi thông báo realtime 1 user cụ thể
export const sendNotification = (userId, notificationData) =>{
    if (!io){
        return;
    }
    // emit vào phòng riêng của user
    io.to(userId.toString()).emit("NEW_NOTIFICATION", notificationData);
}
// user bị xóa -> tự log 
export const emitForceLogoutProject = (userId, projectId, projectName) => {
  if (!io) return;
  console.log(`[Socket] Emitting FORCE_LOGOUT to user ${userId} for project ${projectId}`);
  
  io.to(userId.toString()).emit("FORCE_LOGOUT_PROJECT", {
    projectId,
    projectName,
    message: `You have been removed from project "${projectName}".`
  });
};

// update data
export const emitProjectUpdate = (projectId, type,data) =>{
    if (!io){
        return;
    }
    io.to(projectId.toString()).emit("PROJECT_UPDATE",{type,data});
}