    const TimeAgo = (str) => {
        try {
            const date = new Date(str);
            
            if (isNaN(date.getTime())) {
                return "วันที่ไม่ถูกต้อง";
            }
            
            const now = new Date();
            const diffInSeconds = Math.floor((now - date) / 1000);
            
            // น้อยกว่า 1 นาที
            if (diffInSeconds < 60) {
                return "เมื่อสักครู่";
            }
            
            // น้อยกว่า 1 ชั่วโมง
            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) {
                return `${diffInMinutes} นาทีที่แล้ว`;
            }
            
            // น้อยกว่า 1 วัน
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours} ชั่วโมงที่แล้ว`;
            }
            
            // น้อยกว่า 1 เดือน
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 30) {
                return `${diffInDays} วันที่แล้ว`;
            }
            
            // น้อยกว่า 1 ปี
            const diffInMonths = Math.floor(diffInDays / 30);
            if (diffInMonths < 12) {
                return `${diffInMonths} เดือนที่แล้ว`;
            }
            
            // มากกว่า 1 ปี
            const diffInYears = Math.floor(diffInMonths / 12);
            return `${diffInYears} ปีที่แล้ว`;
            
        } catch (error) {
            console.error("Date parsing error:", error);
            return "วันที่ไม่ถูกต้อง";
        }
    }

export default TimeAgo