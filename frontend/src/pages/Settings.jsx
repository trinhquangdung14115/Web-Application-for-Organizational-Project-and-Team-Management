import React, { useState, useEffect, useRef } from 'react';
import { 
    UserIcon, KeyIcon, SunIcon, GlobeAltIcon, 
    PhotoIcon, CameraIcon, TrashIcon, ArrowPathIcon, 
    XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon,
    ShieldCheckIcon, LockClosedIcon, FingerPrintIcon, MoonIcon,
    CreditCardIcon, CalendarDaysIcon, BanknotesIcon 
} from '@heroicons/react/24/outline'; 
import { useAuth } from '../services/AuthContext';
import { 
    cancelSubscription, 
    resumeSubscription, 
    getPortalUrl, 
    refreshProfile 
} from '../services/authService';

import { API_BASE_URL } from '../utils/constants';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// --- COMPONENT: ALERT WARNING ---
const AlertWarning = ({ organization }) => {
    if (!organization) return null;
    const { subscriptionStatus, plan, subscriptionExpiredAt } = organization;
    
    // Case 1: Payment Failed
    if (subscriptionStatus === 'PAST_DUE') {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm animate-fade-in-down">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Payment Failed</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>We were unable to charge for your Premium renewal. Please update your payment card immediately to avoid service interruption.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Case 2: Expiring Soon
    if (subscriptionStatus === 'CANCELLED' && plan === 'PREMIUM' && subscriptionExpiredAt) {
        const daysLeft = Math.ceil((new Date(subscriptionExpiredAt) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3 && daysLeft >= 0) {
            return (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm animate-fade-in-down">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Premium Plan Expiring Soon</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>Your plan will expire in {daysLeft} days. Resume renewal now to keep your benefits.</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return null;
};

// --- COMPONENT: NOTIFICATION BANNER ---
const NotificationBanner = ({ message, type, onClose }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className={`fixed top-24 right-5 z-[100] flex items-center p-4 mb-4 rounded-lg shadow-lg border animate-fade-in-down ${isSuccess ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {isSuccess ? <CheckCircleIcon className="w-5 h-5 mr-3" /> : <ExclamationCircleIcon className="w-5 h-5 mr-3" />}
            <div className="text-sm font-medium">{message}</div>
            <button onClick={onClose} className="ml-4 hover:bg-black/5 rounded-full p-1">
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

// --- COMPONENT: CONFIRM MODAL ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmColor = "bg-red-600" }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmColor.includes('red') ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium hover:opacity-90 transition shadow-md ${confirmColor}`}>
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: BILLING SECTION ---
const BillingSection = ({ organization, onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });

    // [FIX 1] Lấy plan từ organization, nếu null thì fallback
    // Quan trọng: Check kỹ biến plan từ DB (Backend thường trả về UPPERCASE)
    const plan = organization?.plan ? organization.plan.toUpperCase() : "FREE";
    const status = organization?.subscriptionStatus ? organization.subscriptionStatus.toUpperCase() : "INACTIVE";
    
    // [FIX] Format date dd/mm/yyyy
    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "N/A";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
    
    const expiredAt = formatDate(organization?.subscriptionExpiredAt);

    // Logic xác định có phải Premium không
    const isPremium = plan === "PREMIUM" || plan === "ADMIN"; 

    // Helper: Badge Logic
    const renderBadge = () => {
        if (!isPremium) return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md uppercase">Free Plan</span>;
        
        switch (status) {
            case 'ACTIVE':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-md uppercase flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Active</span>;
            case 'CANCELLED':
                return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-md uppercase flex items-center gap-1"><ExclamationCircleIcon className="w-3 h-3"/> Cancelled</span>;
            case 'PAST_DUE':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md uppercase flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3"/> Past Due</span>;
            default:
                // Nếu là Premium mà status Inactive (lỗi logic DB) thì vẫn hiện cảnh báo
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md uppercase">Inactive</span>;
        }
    };

    // Actions
    const handleAction = async () => {
        setLoading(true);
        try {
            if (modalConfig.type === 'cancel') {
                await cancelSubscription();
            } else if (modalConfig.type === 'resume') {
                await resumeSubscription();
            }
            await onRefresh(); // Reload data
        } catch (error) {
            alert(error.message || "Action failed");
        } finally {
            setLoading(false);
            setModalConfig({ isOpen: false, type: null });
        }
    };

    const handleUpdateCard = async () => {
        setLoading(true);
        try {
            const data = await getPortalUrl();
            if (data.url) window.location.href = data.url;
        } catch (error) {
            alert("Failed to get portal link: " + error.message);
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative mt-8">
            <ConfirmModal 
                isOpen={modalConfig.isOpen} 
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
                onConfirm={handleAction}
                title={modalConfig.type === 'cancel' ? "Cancel Premium Plan?" : "Resume Subscription?"}
                message={modalConfig.type === 'cancel' 
                    ? `You can still use Premium features until ${expiredAt}. Are you sure you want to cancel the renewal?` 
                    : "Your Premium plan will automatically renew in the next cycle. Do you want to continue?"}
                confirmText={modalConfig.type === 'cancel' ? "Confirm Cancel" : "Resume Now"}
                confirmColor={modalConfig.type === 'cancel' ? "bg-red-600" : "bg-green-600"}
            />

            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-start gap-4">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                    <BanknotesIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Billing Information</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your subscription plan and payment methods.</p>
                </div>
            </div>

            <div className="p-6 sm:p-8">
                <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
                    
                    {/* Info Column */}
                    <div className="space-y-2 flex-1 w-full">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 font-medium">Current Plan:</span>
                            {renderBadge()}
                        </div>
                        
                        {/* [FIX 2] Sửa hiển thị giá đúng $20 */}
                        <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {isPremium ? "$20 / Month" : "Free"}
                        </div>

                        {isPremium && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                                {status === 'CANCELLED' ? (
                                    <span className="text-red-600 font-medium">Expires on: {expiredAt}</span>
                                ) : (
                                    <span>Next renewal: <span className="font-semibold text-gray-900">{expiredAt}</span></span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions Column */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        
                        {(!isPremium || status === 'INACTIVE') && (
                            <button 
                                onClick={() => window.location.href = '/pricing'}
                                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                            >
                                <CreditCardIcon className="w-4 h-4"/> Upgrade to Premium
                            </button>
                        )}

                        {isPremium && status === 'ACTIVE' && (
                            <>
                                <button 
                                    onClick={() => setModalConfig({ isOpen: true, type: 'cancel' })}
                                    disabled={loading}
                                    className="px-4 py-2.5 bg-white border border-gray-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 hover:border-red-200 transition disabled:opacity-50"
                                >
                                    Cancel Renewal
                                </button>
                                <button className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition">
                                    View Invoice
                                </button>
                            </>
                        )}

                        {isPremium && status === 'CANCELLED' && (
                            <button 
                                onClick={() => setModalConfig({ isOpen: true, type: 'resume' })}
                                disabled={loading}
                                className="px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2"
                            >
                                <ArrowPathIcon className="w-4 h-4"/> Resume Subscription
                            </button>
                        )}

                        {isPremium && status === 'PAST_DUE' && (
                            <button 
                                onClick={handleUpdateCard}
                                disabled={loading}
                                className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
                            >
                                <CreditCardIcon className="w-4 h-4"/> Update Card
                            </button>
                        )}
                    </div>
                </div>
                
                {isPremium && status === 'PAST_DUE' && (
                    <p className="text-xs text-red-500 mt-3 text-center md:text-right">
                        * There is an issue with your card. Please update it to continue using the service.
                    </p>
                )}
            </div>
        </div>
    );
};

// --- PRESERVED COMPONENTS ---
const ImageCropperModal = ({ imageSrc, onCancel, onSave }) => { return null; }; // Placeholder
const ProfileInfo = () => { return <div>Profile Content</div> }; // Placeholder

// --- ACCOUNT SETTINGS ---
const AccountSettings = ({ organization, onRefresh }) => {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);

    const showNotification = (message, type = 'success') => setNotification({ message, type });
    const handleChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const handleUpdatePassword = async () => {
        if (!passwords.currentPassword) return showNotification('Current password is required.', 'error');
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST', headers: getHeaders(), body: JSON.stringify({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            showNotification('Password changed successfully!', 'success');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) { showNotification(error.message, 'error'); } 
        finally { setIsLoading(false); }
    };

    return (
        <div className="space-y-8">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden relative">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <ShieldCheckIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Security & Login</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage your password to keep your account secure.</p>
                    </div>
                </div>
                
                <div className="p-6 sm:p-8 space-y-8">
                      <div className="max-w-md">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                        <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="password" name="newPassword" placeholder="New Password" value={passwords.newPassword} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg"/>
                        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={passwords.confirmPassword} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg"/>
                      </div>
                      <div className="flex justify-end pt-4">
                        <button onClick={handleUpdatePassword} disabled={isLoading} className="px-6 py-2 bg-black text-white rounded-lg">Update Password</button>
                      </div>
                </div>
            </div>

            <BillingSection organization={organization} onRefresh={onRefresh} />
        </div>
    );
};

// --- PREFERENCES ---
const Preferences = () => { return <div className="bg-white p-6 rounded-xl shadow-lg border">Preferences Content</div>; };

// --- TAB BUTTON ---
const TabButton = ({ label, activeTab, onClick }) => (
    <button
        className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === label ? 'text-gray-900 border-b-2 font-semibold' : 'text-gray-500 hover:text-gray-700'
        }`}
        style={activeTab === label ? { borderColor: 'var(--color-brand)' } : { borderColor: 'transparent' }}
        onClick={() => onClick(label)}
    >
        {label}
    </button>
);

// --- MAIN SETTINGS ---
const Settings = () => {
    const [activeTab, setActiveTab] = useState('Account Settings'); 
    const { setUser } = useAuth();

    // [FIX 3] Khởi tạo organization từ LocalStorage để tránh UI nhảy về FREE lúc đầu
    const [organization, setOrganization] = useState(() => {
        const savedOrg = localStorage.getItem('organization');
        return savedOrg ? JSON.parse(savedOrg) : null;
    });

    const syncData = async () => {
        try {
            const data = await refreshProfile(); 
            if (data) {
                // Cập nhật state ngay khi có data mới từ API
                setUser(data.user);
                setOrganization(data.organization);
            }
        } catch (err) {
            console.error("Sync failed:", err);
        }
    };

    useEffect(() => {
        syncData();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'Profile Info': return <ProfileInfo />;
            case 'Account Settings': return <AccountSettings organization={organization} onRefresh={syncData} />;
            case 'Preferences': return <Preferences />;
            default: return <ProfileInfo />;
        }
    };
    
    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto"> 
                <AlertWarning organization={organization} />

                <div className="flex space-x-6 border-b border-gray-200 mb-8">
                    <TabButton label="Profile Info" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton label="Account Settings" activeTab={activeTab} onClick={setActiveTab} />
                    <TabButton label="Preferences" activeTab={activeTab} onClick={setActiveTab} />
                </div>

                {renderContent()}
            </div>
        </div>
    );
}

export default Settings;