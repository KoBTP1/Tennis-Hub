Mình đã hoàn thành luồng dành cho Owner (chủ sân) theo yêu cầu trong guideline.md.

Các phần mình đã làm bao gồm:

Backend API:

Court: Tạo, lấy danh sách sân, sửa, xóa sân (src/models/Court.js, courtController.js, courtRoutes.js).
CourtSlot: Tạo khung giờ đặt sân, lấy slot, cập nhật và xóa slot (src/models/CourtSlot.js, courtSlotController.js, courtSlotRoutes.js).
Booking: Lấy danh sách booking của vendor, cập nhật trạng thái (src/models/Booking.js, bookingController.js, bookingRoutes.js).
Đăng ký toàn bộ các route này vào app.js kèm bảo mật authMiddleware (phân quyền owner/vendor).
Frontend App React Native:

Khởi tạo courtService.js và bookingService.js gọi API sử dụng Axios và kèm JWT token từ AsyncStorage.
Hoàn thiện OwnerCourtsScreen.js: Lấy danh sách sân từ API và mapping vào UI, thêm chức năng xóa sân.
Hoàn thiện OwnerScheduleScreen.js: Có dropdown chọn sân, chọn ngày, và render danh sách slot khả dụng từ API.
Hoàn thiện OwnerBookingsScreen.js: Hiển thị danh sách booking, có bộ lọc theo trạng thái (Confirmed/Completed/Cancelled), nút chuyển trạng thái booking và tự động tính toán số liệu thống kê.


Đăng ký & Đăng nhập (Authentication)
Test Đăng ký Owner:
Mở App ra, vào trang Đăng ký.
Điền thông tin, ở dưới cùng nhớ chọn tab "Court Owner".
Ấn nút Đăng ký.
Test Điều hướng:
Quay ra trang Đăng nhập (Sign In).
Điền tài khoản vừa tạo.
Kiểm tra xem app có bốc bạn vào đúng Owner Dashboard (trang tổng quan có các nút màu xanh) thay vì trang chủ tìm kiếm sân của khách hay không.
2. Tab Quản lý Sân (Manage Courts)
Chuyển qua Tab thứ 2 (dưới cùng bên dưới màn hình).
Test Thêm sân:
Bấm nút "+ Add New Court".
Điền Tên sân (VD: Nhổn Tennis), Địa chỉ, Giá tiền (VD: 50).
Ấn Create. Kiểm tra xem sân mới có hiện ra trên màn hình ngay lập tức không.
Test Xóa sân:
Bấm biểu tượng 🗑️ (Thùng rác) hoặc chữ Delete trên cái Sân bạn vừa tạo.
App sẽ hiện lên câu hỏi "Bạn có chắc muốn xóa?". Chọn OK.
Kiểm tra xem sân có biến mất khỏi màn hình không. (Bạn tạo lại 1-2 cái sân mới để lát nữa Test phần tiếp theo nhé).
3. Tab Quản lý Lịch / Slot (Manage Schedule)
Chuyển qua Tab thứ 3.
Test Chọn Sân: Ấn vào cái thẻ đang hiển thị tên sân trên cùng màn hình. Gõ/Click nhẹ vào đó xem nó có đổi qua lại giữa các sân bạn đang có hay không.
Test Thêm Lịch (Slot):
Chọn một Sân bất kỳ.
Ấn nút "+ Add Time Slot".
Điền thời gian (VD: Start: 08:00, End: 09:00). Giá tiền app sẽ tự lấy giá của sân, bạn có thể sửa lại.
Ấn Create. Kiểm tra xem dưới màn hình có hiện ra 1 Slot màu xanh lá (trạng thái Available) không.
Mẹo: Tạo thêm vài slot nữa (VD: 09:00 - 10:00) cho dễ nhìn.
Test Xóa Lịch: Ấn nút Delete ở một lịch vừa tạo xem có xóa thành công không.
4. Tab Quản lý Đơn Đặt Sân (View Bookings)
Để test phần này chân thực nhất, bạn cần làm người chơi (Player) đặt cái Slot bạn vừa tạo trước.

Chuẩn bị data thật:
Tắt máy ảo/App đang đăng nhập tài khoản Owner. Đăng ký 1 tài khoản mới với vai trò là "Player".
Lên màn hình Search của Player, tìm cái Sân của bạn, bấm Đặt Sân (Book) vào đúng cái Slot (08:00 - 09:00) hồi nãy bạn tạo.
Log out tài khoản Player ra, Đăng nhập lại Tài khoản Owner.
Test Quản lý Booking (Chủ sân):
Ở app Owner, vào Tab cuối cùng (Bookings).
Kiểm tra xem Đơn đặt sân của người Player kia đã chui vào đây chưa (Trạng thái Confirmed).
Phía trên có cái Tab lọc (All, Confirmed, Completed, Cancelled). Bạn ấn qua lại xem nó có lọc đúng đơn không.
Cùng màn hình đó, bấm vô nút "Complete" ở cái đơn hàng. Nó phải chuyển trạng thái sang Completed (Đã hoàn thành/Thanh toán xong), đồng thời số tiền ở dòng thống kê Revenue (Doanh thu) trên cùng màn hình phải tăng lên!






Về phần Backend (máy chủ):
Bạn mở cửa sổ Terminal nào mà đang đứng ở thư mục backend-api ấy.
Dừng nó lại (Ctrl + C) và gõ: npm run dev (đúng là lệnh này ạ).
Về phần Mobile App (của bạn):
Bạn cứ chạy npm start như bình thường ở thư mục mobile-app là đúng rồi.