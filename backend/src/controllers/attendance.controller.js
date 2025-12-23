import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";
import Organization from "../models/organization.model.js";
import User from "../models/user.model.js";
/**
 * @desc    Get client IP address
 * @param   {Request} req
 * @returns {String} IP address
 */
const getClientIp = (req) => {
  let ip =req.headers["x-forwarded-for"];
  if (ip){
    ip = ip.split(",")[0].trim();
  }
  else{
    ip = req.headers["x-real-ip"] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         "unknown";
  }
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1"; // FIX: 127.0.0.1
  if (ip.startsWith("::ffff:")) return ip.substring(7);
  return ip;
};


/**
 * @desc    Normalize IP address for comparison
 */
const normalizeIP = (ip) => {
  if (!ip) return null;
  
  // Remove IPv6 prefix
  if (ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  
  // Convert localhost variations
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }
  
  return ip.trim();
};

/**
 * @desc    Check if IP is in whitelist (enhanced)
 */
const isIPAllowed = (clientIp, allowedIps) => {
  if (!clientIp || !allowedIps || allowedIps.length === 0) {
    return false;
  }

  const normalizedClientIP = normalizeIP(clientIp);
  
  return allowedIps.some(item => {
    if (!item.isActive) return false;
    
    const normalizedAllowedIP = normalizeIP(item.ip);
    
    // Exact match
    if (normalizedAllowedIP === normalizedClientIP) {
      return true;
    }
    
    // Wildcard support (optional: 192.168.1.* format)
    if (item.ip.includes('*')) {
      const pattern = item.ip.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(normalizedClientIP);
    }
    
    return false;
  });
};

/**
 * @desc    Check if user already checked in today
 * @param   {ObjectId} userId
 * @param   {ObjectId} projectId
 * @returns {Object|null} Today's attendance or null
 */
const getTodayAttendance = async (userId, organizationId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return await Attendance.findOne({
    userId,
    organizationId,
    checkInTime: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });
};

/**
 * @desc    Validate IP address format (IPv4 or wildcard)
 */
const isValidIPFormat = (ip) => {
  if (!ip) return false;
  
  const wildcardPattern = /^(\d{1,3}\.){3}\*$|^(\d{1,3}\.){2}\*(\.\*)?$/;
  if (wildcardPattern.test(ip)) {
    const parts = ip.split('.');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] !== '*') {
        const num = parseInt(parts[i], 10);
        if (isNaN(num) || num < 0 || num > 255) return false;
      }
    }
    return true;
  }
  
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Pattern.test(ip)) return false;
  
  const octets = ip.split('.');
  return octets.every(octet => {
    const num = parseInt(octet, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
};

/**
 * @desc    Check-in attendance
 * @route   POST /attendance/checkin 
 * @access  Private
 */
export const checkIn = async (req, res) => {
  try {
    const { note } = req.body;
    const userId = req.user._id;
    
    const user = await User.findById(userId).select("currentOrganizationId");

    // Validate organization
    if (!user || !user.currentOrganizationId) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "User does not belong to any Organization. Please switch to an organization first.",
      });
    }
    const organizationId = user.currentOrganizationId;
    // Check if project exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: "Organization not found",
      });
    }


    // Check if already checked in today
    const existingAttendance = await getTodayAttendance(userId, organizationId);
    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        error: "ConflictError",
        message: "You have already checked in today",
        data: existingAttendance,
      });
    }

    // Get client IP
    const clientIp = getClientIp(req);
    const isIpCheckEnabled = organization.attendanceSettings?.enableIpCheck ?? true;

    if (isIpCheckEnabled) {
        // Tìm xem IP Client có nằm trong danh sách Allowed IPs (và đang Active) của Org không
        const isAllowed = isIPAllowed(clientIp, organization.allowedIps);
        
        // Chặn nếu không đúng IP (Trừ khi là Dev env)
        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                error: "ForbiddenError",
                message: "Invalid IP, Please connect to your company's network.",
                debug: { 
                    yourIp: clientIp, 
                    normalizedIp: normalizeIP(clientIp),
                    organizationId: organizationId,
                    totalWhitelistIPs: organization.allowedIps.length,
                    activeWhitelistIPs: organization.allowedIps.filter(ip => ip.isActive).length
                }
            });
        }
    }
    

    // Determine status based on time (example: late if after 9 AM)
    const now = new Date();
    const standardHour = organization.attendanceSettings?.standardCheckInHour || 9;
    const status = now.getHours() >= standardHour ? "LATE" : "PRESENT";

    // Create attendance record
    const attendance = new Attendance({
      userId,
      organizationId: organizationId, 
      checkInTime: now,
      checkInIp: clientIp,
      status,
      note: note || "",
    });

    await attendance.save();
    // Populate user info
    await attendance.populate("userId", "name email role");

    res.status(201).json({
      success: true,
      message: "Check-in successful",
      data: attendance,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};

/**
 * @desc    Get current IP address (for Admin/Manager to whitelist)
 * @route   GET /attendance/my-ip
 * @access  Private (Admin/Manager)
 */
export const getMyCurrentIP = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    if (userRole !== "Admin" ) {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "Only Admin or Manager can view IP address",
      });
    }

    const clientIp = getClientIp(req);
    
    // Detailed IP information for debugging
    const ipInfo = {
      ip: clientIp,
      normalizedIp: normalizeIP(clientIp),
      headers: {
        'x-forwarded-for': req.headers["x-forwarded-for"],
        'x-real-ip': req.headers["x-real-ip"],
        'connection-remote': req.connection?.remoteAddress,
        'socket-remote': req.socket?.remoteAddress
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "Your current IP address",
      data: ipInfo
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};

/**
 * @desc    Add IP to organization whitelist
 * @route   POST /attendance/whitelist-ip
 * @access  Private (Admin/Manager)
 */
export const addWhitelistIP = async(req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const { ip, description } = req.body;

    if (userRole !== "Admin") {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "Only Admin or Manager can manage IP whitelist",
      });
    }

    if (!ip) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "IP address is required",
      });
    }

    //  Validate IP format
    const trimmedIP = ip.trim();
    if (!isValidIPFormat(trimmedIP)) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "Invalid IP address format. Expected IPv4 (e.g., 192.168.1.1) or wildcard (e.g., 192.168.1.*)",
      });
    }

    const user = await User.findById(userId).select("currentOrganizationId");
    if (!user || !user.currentOrganizationId) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "User does not belong to any Organization.",
      });
    }

    const organization = await Organization.findById(user.currentOrganizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: "Organization not found",
      });
    }

    //  Check if IP already exists in whitelist
    const normalizedInputIP = normalizeIP(trimmedIP);

    const existingIP = organization.allowedIps.find(
      item => normalizeIP(item.ip) === normalizedInputIP
    );

    if (existingIP) {
      return res.status(409).json({
        success: false,
        error: "ConflictError",
        message: "IP address already in whitelist",
        data: existingIP
      });
    }

    //  Add new IP to whitelist
    organization.allowedIps.push({
      ip: normalizedInputIP,
      description: description || `Added by ${req.user.name}`,
      isActive: true,
      addedBy: userId,
      addedAt: new Date()
    });

    // Try-catch for save operation
    try {
      await organization.save();
    } catch (saveErr) {
      console.error("Failed to save organization:", saveErr);
      
      if (saveErr.code === 11000) {
        return res.status(409).json({
          success: false,
          error: "DuplicateError",
          message: "Duplicate entry detected",
        });
      }
      
      throw saveErr;
    }

    res.status(201).json({
      success: true,
      message: "IP address added to whitelist successfully",
      data: {
        ip: normalizedInputIP,
        description: description || `Added by ${req.user.name}`,
        addedAt: new Date()
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};


/**
 * @desc    Get organization IP whitelist
 * @route   GET /attendance/whitelist
 * @access  Private (Admin/Manager)
 */
export const getWhitelistIPs = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    if (userRole !== "Admin") {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "Only Admin or Manager can view IP whitelist",
      });
    }

    const user = await User.findById(userId).select("currentOrganizationId");
    if (!user || !user.organizationId) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "User does not belong to any Organization.",
      });
    }

    const organization = await Organization.findById(user.currentOrganizationId)
      .populate('allowedIps.addedBy', 'name email');

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: "NotFoundError",
        message: "Organization not found",
      });
    }

    res.json({
      success: true,
      data: {
        organizationName: organization.name,
        attendanceSettings: organization.attendanceSettings,
        allowedIps: organization.allowedIps,
        totalIPs: organization.allowedIps.length,
        activeIPs: organization.allowedIps.filter(ip => ip.isActive).length
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};


/**
 * @desc    Get my attendance status for today
 * @route   GET /attendance/me/today
 * @access  Private
 */
export const getMyAttendanceToday = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Lấy organizationId từ user
    const user = await User.findById(userId).select("organizationId");
    
    if (!user || !user.organizationId) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "User does not belong to any Organization.",
      });
    }
    const attendance = await getTodayAttendance(userId, user.organizationId);

    if (!attendance) {
      return res.json({
        success: true,
        message: "No check-in record for today",
        data: {
          hasCheckedIn: false,
          status: "ABSENT",
        },
      });
    }

    res.json({
      success: true,
      data: {
        hasCheckedIn: true,
        checkInTime: attendance.checkInTime,
        status: attendance.status,
        note: attendance.note,
        checkInIp: attendance.checkInIp,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};

/**
 * @desc    Get attendance history for a project
 * @route   GET /attendance/all 
 * @access  Private (Admin/Manager)
 */
export const getProjectAttendance = async (req, res) => {
  try {
    const currentUser = req.user;
    const { startDate, endDate, userId } = req.query;

    const requestUser = await User.findById(currentUser._id).select("organizationId role");
    const orgId = requestUser.organizationId;


    if (!orgId) {
        return res.status(400).json({ success: false, message: "No Organization Context" });
    }

    const query = {organizationId: orgId};

    // Check permissions (only Admin/Manager can view all attendance)
    const userRole = req.user.role;

    if (userRole !== "Admin" && userRole !== "Manager") {
      return res.status(403).json({
        success: false,
        error: "ForbiddenError",
        message: "Only Admin or Manager can view project attendance",
      });
    }


    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          error: "ValidationError",
          message: "Invalid user ID format",
        });
      }
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.checkInTime = {};
      if (startDate) query.checkInTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.checkInTime.$lte = end;
      }
    }

    const attendances = await Attendance.find(query)
      .populate("userId", "name email role")
      .sort({ checkInTime: -1 });

    res.json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};

/**
 * @desc    Get my attendance history
 * @route   GET /attendance/me
 * @access  Private
 */
export const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("currentOrganizationId");
    const {startDate,endDate} = req.query;

    if (!user || !user.currentOrganizationId) {
      return res.status(400).json({
        success: false,
        error: "ValidationError",
        message: "User does not belong to any Organization. Please switch to an organization first.",
      });
    }

    const query = { userId , organizationId: user.currentOrganizationId};

    if (startDate || endDate) {
      query.checkInTime = {};
      if (startDate) query.checkInTime.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.checkInTime.$lte = end;
      }
    }

    const attendances = await Attendance.find(query)
      .populate("organizationId", "name")
      .sort({ checkInTime: -1 });

    res.json({
      success: true,
      count: attendances.length,
      data: attendances,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "ServerError",
      message: err.message,
    });
  }
};


/**
 * @desc    Update IP config (Edit IP, Description, Active Status)
 * @route   PUT /attendance/whitelist-ip/:ipId
 * @access  Private (Admin/Manager)
 */
export const updateWhitelistIP = async (req, res) => {
  try {
    const { ipId } = req.params;
    const { ip, description, isActive } = req.body; 
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. Check quyền
    if (userRole !== "Admin" && userRole !== "Manager") {
      return res.status(403).json({ success: false, error: "ForbiddenError", message: "Forbidden" });
    }

    // 2. Lấy Organization
    const user = await User.findById(userId).select("currentOrganizationId");
    if (!user || !user.currentOrganizationId) {
        return res.status(400).json({ success: false, error: "ValidationError", message: "User not in Organization" });
    }

    const organization = await Organization.findById(user.currentOrganizationId);
    if (!organization) {
        return res.status(404).json({ success: false, error: "NotFoundError", message: "Organization not found" });
    }

    // 3. Tìm IP sub-document trong mảng
    const whitelistItem = organization.allowedIps.id(ipId);

    if (!whitelistItem) {
        return res.status(404).json({ success: false, error: "NotFoundError", message: "IP Config not found" });
    }

    // 4. Update các trường 
    if (ip) whitelistItem.ip = ip; // Lưu ý: Nên validate format IP ở đây nếu kỹ
    if (description) whitelistItem.description = description;
    if (typeof isActive === 'boolean') whitelistItem.isActive = isActive;

    await organization.save();

    res.json({ 
        success: true, 
        message: "IP updated successfully", 
        data: whitelistItem 
    });

  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Remove IP from whitelist
 * @route   DELETE /attendance/whitelist-ip/:ipId
 * @access  Private (Admin/Manager)
 */
export const removeWhitelistIP = async (req, res) => {
  try {
    const { ipId } = req.params; // ID của dòng IP cần xóa
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. Check quyền
    if (userRole !== "Admin" && userRole !== "Manager") {
      return res.status(403).json({ success: false, error: "ForbiddenError", message: "Forbidden" });
    }

    // 2. Lấy Organization
    const user = await User.findById(userId).select("currentOrganizationId");
    if (!user || !user.currentOrganizationId) {
        return res.status(400).json({ success: false, error: "ValidationError", message: "User not in Organization" });
    }

    const organization = await Organization.findById(user.currentOrganizationId);
    
    // 3. Xóa IP khỏi mảng allowedIps
    organization.allowedIps.pull({ _id: ipId });
    
    await organization.save();

    res.json({ success: true, message: "IP removed successfully" });

  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};