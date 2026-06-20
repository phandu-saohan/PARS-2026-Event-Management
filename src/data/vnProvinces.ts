/**
 * Danh sách đơn vị hành chính Việt Nam mới nhất
 * Thẩm định theo các thông tư địa lý mới nhất (bao gồm TP. Thủ Đức, các quận huyện sáp nhập mới nhất)
 */

export interface Ward {
  name: string;
}

export interface District {
  name: string;
  wards: string[];
}

export interface Province {
  name: string;
  districts: District[];
}

export const VN_PROVINCES: Province[] = [
  {
    name: "Hồ Chí Minh",
    districts: [
      { name: "Thành phố Thủ Đức", wards: ["Phường An Khánh", "Phường An Lợi Đông", "Phường An Phú", "Phường Bình Chiểu", "Phường Bình Thọ", "Phường Cát Lái", "Phường Hiệp Bình Chánh", "Phường Hiệp Bình Phước", "Phường Linh Chiểu", "Phường Linh Đông", "Phường Linh Tây", "Phường Linh Trung", "Phường Linh Xuân", "Phường Long Bình", "Phường Long Phước", "Phường Long Thạnh Mỹ", "Phường Long Trường", "Phường Phú Hữu", "Phường Phước Bình", "Phường Phước Long A", "Phường Phước Long B", "Phường Tam Bình", "Phường Tam Phú", "Phường Tăng Nhơn Phú A", "Phường Tăng Nhơn Phú B", "Phường Thạnh Mỹ Lợi", "Phường Thảo Điền", "Phường Thủ Thiêm", "Phường Trường Thạnh", "Phường Trường Thọ"] },
      { name: "Quận 1", wards: ["Phường Bến Nghé", "Phường Bến Thành", "Phường Cầu Kho", "Phường Cầu Ông Lãnh", "Phường Cô Giang", "Phường Đa Kao", "Phường Nguyễn Thái Bình", "Phường Nguyễn Cư Trinh", "Phường Phạm Ngũ Lão", "Phường Tân Định"] },
      { name: "Quận 3", wards: ["Phường Võ Thị Sáu", "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"] },
      { name: "Quận 4", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 6", "Phường 8", "Phường 9", "Phường 10", "Phường 13", "Phường 14", "Phường 15", "Phường 16"] },
      { name: "Quận 5", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"] },
      { name: "Quận 6", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14"] },
      { name: "Quận 7", wards: ["Phường Bình Thuận", "Phường Phú Mỹ", "Phường Phú Thuận", "Phường Tân Kiểng", "Phường Tân Phong", "Phường Tân Phú", "Phường Tân Quy", "Phường Tân Thuận Đông", "Phường Tân Thuận Tây"] },
      { name: "Quận 8", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16"] },
      { name: "Quận 10", wards: ["Phường 1", "Phường 2", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"] },
      { name: "Quận 11", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16"] },
      { name: "Quận 12", wards: ["Phường An Phú Đông", "Phường Đông Hưng Thuận", "Phường Hiệp Thành", "Phường Tân Chánh Hiệp", "Phường Tân Hưng Thuận", "Phường Tân Thới Hiệp", "Phường Tân Thới Nhất", "Phường Thạnh Lộc", "Phường Thạnh Xuân", "Phường Thới An", "Phường Trung Mỹ Tây"] },
      { name: "Quận Bình Thạnh", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 5", "Phường 6", "Phường 7", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 17", "Phường 19", "Phường 21", "Phường 22", "Phường 24", "Phường 25", "Phường 26", "Phường 27", "Phường 28"] },
      { name: "Quận Gò Vấp", wards: ["Phường 1", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15", "Phường 16", "Phường 17"] },
      { name: "Quận Phú Nhuận", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 13", "Phường 15", "Phường 17"] },
      { name: "Quận Tân Bình", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường 13", "Phường 14", "Phường 15"] },
      { name: "Quận Tân Phú", wards: ["Phường Hiệp Tân", "Phường Hòa Thạnh", "Phường Phú Thạnh", "Phường Phú Thọ Hòa", "Phường Phú Trung", "Phường Sơn Kỳ", "Phường Tân Quý", "Phường Tân Sơn Nhì", "Phường Tân Thành", "Phường Tân Thới Hòa", "Phường Tây Thạnh"] },
      { name: "Quận Bình Tân", wards: ["Phường An Lạc", "Phường An Lạc A", "Phường Bình Hưng Hòa", "Phường Bình Hưng Hòa A", "Phường Bình Hưng Hòa B", "Phường Bình Trị Đông", "Phường Bình Trị Đông A", "Phường Bình Trị Đông B", "Phường Tân Tạo", "Phường Tân Tạo A"] },
      { name: "Huyện Bình Chánh", wards: ["Thị trấn Tân Túc", "Xã An Phú Tây", "Xã Bình Chánh", "Xã Bình Hưng", "Xã Bình Lợi", "Xã Đa Phước", "Xã Hưng Long", "Xã Lê Minh Xuân", "Xã Phạm Văn Hai", "Xã Phong Phú", "Xã Quy Đức", "Xã Tân Kiên", "Xã Tân Nhựt", "Xã Tân Quý Tây", "Xã Vĩnh Lộc A", "Xã Vĩnh Lộc B"] },
      { name: "Huyện Hóc Môn", wards: ["Thị trấn Hóc Môn", "Xã Bà Điểm", "Xã Đông Thạnh", "Xã Nhị Bình", "Xã Tân Hiệp", "Xã Tân Thới Nhì", "Xã Tân Xuân", "Xã Thới Tam Thôn", "Xã Trung Chánh", "Xã Xuân Thới Đông", "Xã Xuân Thới Thượng", "Xã Xuân Thới Sơn"] },
      { name: "Huyện Củ Chi", wards: ["Thị trấn Củ Chi", "Xã An Nhơn Tây", "Xã An Phú", "Xã Bình Mỹ", "Xã Hòa Phú", "Xã Nhuận Đức", "Xã Phạm Văn Cội", "Xã Phuớc Hiệp", "Xã Phước Thạnh", "Xã Phước Vĩnh An", "Xã Tân An Hội", "Xã Tân Phú Trung", "Xã Tân Thạnh Đông", "Xã Tân Thạnh Tây", "Xã Tân Thông Hội", "Xã Thái Mỹ", "Xã Trung An", "Xã Trung Lập Hạ", "Xã Trung Lập Thượng"] },
      { name: "Huyện Nhà Bè", wards: ["Thị trấn Nhà Bè", "Xã Hiệp Phước", "Xã Long Thới", "Xã Nhơn Đức", "Xã Phú Xuân", "Xã Phước Kiển", "Xã Phước Lộc"] },
      { name: "Huyện Cần Giờ", wards: ["Thị trấn Cần Thạnh", "Xã An Thới Đông", "Xã Bình Khánh", "Xã Long Hòa", "Xã Lý Nhơn", "Xã Tam Thôn Hiệp", "Xã Thạnh An"] }
    ]
  },
  {
    name: "Hà Nội",
    districts: [
      { name: "Quận Ba Đình", wards: ["Phường Cống Vị", "Phường Điện Biên", "Phường Đội Cấn", "Phường Giảng Võ", "Phường Kim Mã", "Phường Liễu Giai", "Phường Ngọc Hà", "Phường Ngọc Khánh", "Phường Nguyễn Trung Trực", "Phường Phúc Xá", "Phường Quán Thánh", "Phường Thành Công", "Phường Trúc Bạch", "Phường Vĩnh Phúc"] },
      { name: "Quận Hoàn Kiếm", wards: ["Phường Chương Dương", "Phường Cửa Đông", "Phường Cửa Nam", "Phường Đồng Xuân", "Phường Hàng Bạc", "Phường Hàng Bài", "Phường Hàng Bồ", "Phường Hàng Bông", "Phường Hàng Buồm", "Phường Hàng Đào", "Phường Hàng Gai", "Phường Hàng Mã", "Phường Hàng Trống", "Phường Lý Thái Tổ", "Phường Miếu Hai Dong", "Phường Phan Chu Trinh", "Phường Phúc Tân", "Phường Tràng Tiền"] },
      { name: "Quận Tây Hồ", wards: ["Phường Bưởi", "Phường Nhật Tân", "Phường Phú Thượng", "Phường Quảng An", "Phường Thụy Khuê", "Phường Tứ Liên", "Phường Xuân La", "Phường Yên Phụ"] },
      { name: "Quận Long Biên", wards: ["Phường Bồ Đề", "Phường Cự Khối", "Phường Đức Giang", "Phường Gia Thụy", "Phường Giang Biên", "Phường Long Biên", "Phường Ngọc Lâm", "Phường Ngọc Thụy", "Phường Phúc Đồng", "Phường Phúc Lợi", "Phường Sài Đồng", "Phường Thạch Bàn", "Phường Thượng Thanh", "Phường Việt Hưng"] },
      { name: "Quận Cầu Giấy", wards: ["Phường Dịch Vọng", "Phường Dịch Vọng Hậu", "Phường Mai Dịch", "Phường Nghĩa Đô", "Phường Nghĩa Tân", "Phường Quan Hoa", "Phường Trung Hòa", "Phường Yên Hòa"] },
      { name: "Quận Đống Đa", wards: ["Phường Cát Linh", "Phường Hàng Bột", "Phường Khâm Thiên", "Phường Khương Thượng", "Phường Kim Liên", "Phường Láng Hạ", "Phường Láng Thượng", "Phường Nam Đồng", "Phường Ngã Tư Sở", "Phường Ô Chợ Dừa", "Phường Phương Liên", "Phường Phương Mai", "Phường Quang Trung", "Phường Quốc Tử Giám", "Phường Thịnh Quang", "Phường Thổ Quan", "Phường Trung Liệt", "Phường Trung Phụng", "Phường Trung Tự", "Phường Văn Chương", "Phường Văn Miếu"] },
      { name: "Quận Hai Bà Trưng", wards: ["Phường Bạch Đằng", "Phường Bách Khoa", "Phường Bạch Mai", "Phường Cầu Dền", "Phường Đống Mác", "Phường Đồng Nhân", "Phường Đồng Tâm", "Phường Lê Đại Hành", "Phường Minh Khai", "Phường Nguyễn Du", "Phường Phạm Đình Hổ", "Phường Phố Huế", "Phường Quỳnh Lôi", "Phường Quỳnh Mai", "Phường Thanh Lương", "Phường Thanh Nhàn", "Phường Trương Định", "Phường Vĩnh Tuy"] },
      { name: "Quận Hoàng Mai", wards: ["Phường Đại Kim", "Phường Định Công", "Phường Giáp Bát", "Phường Hoàng Liệt", "Phường Hoàng Văn Thụ", "Phường Lĩnh Nam", "Phường Mai Động", "Phường Tân Mai", "Phường Thanh Trì", "Phường Thịnh Liệt", "Phường Trần Phú", "Phường Tương Mai", "Phường Vĩnh Hưng", "Phường Yên Sở"] },
      { name: "Quận Thanh Xuân", wards: ["Phường Hạ Đình", "Phường Khương Đình", "Phường Khương Mai", "Phường Khương Trung", "Phường Kim Giang", "Phường Nhân Chính", "Phường Phương Liệt", "Phường Thanh Xuân Bắc", "Phường Thanh Xuân Nam", "Phường Thanh Xuân Trung", "Phường Thượng Đình"] },
      { name: "Quận Nam Từ Liêm", wards: ["Phường Cầu Diễn", "Phường Đại Mỗ", "Phường Mễ Trì", "Phường Mỹ Đình 1", "Phường Mỹ Đình 2", "Phường Phú Đô", "Phường Phương Canh", "Phường Tây Mỗ", "Phường Trung Văn", "Phường Xuân Phương"] },
      { name: "Quận Bắc Từ Liêm", wards: ["Phường Cổ Nhuế 1", "Phường Cổ Nhuế 2", "Phường Đức Thắng", "Phường Đông Ngạc", "Phường Liên Mạc", "Phường Minh Khai", "Phường Phú Diễn", "Phường Phúc Diễn", "Phường Tây Tựu", "Phường Thượng Cát", "Phường Thụy Phương", "Phường Xuân Đỉnh", "Phường Xuân Tảo"] },
      { name: "Quận Hà Đông", wards: ["Phường Biên Giang", "Phường Đồng Mai", "Phường Dương Nội", "Phường Hà Cầu", "Phường Kiến Hưng", "Phường La Khê", "Phường Mộ Lao", "Phường Nguyễn Trãi", "Phường Phú Lãm", "Phường Phú Lương", "Phường Phú La", "Phường Phúc La", "Phường Quang Trung", "Phường Vạn Phúc", "Phường Văn Quán", "Phường Yên Nghĩa", "Phường Yết Kiêu"] },
      { name: "Thị xã Sơn Tây", wards: ["Phường Lê Lợi", "Phường Ngô Quyền", "Phường Phú Thịnh", "Phường Quang Trung", "Phường Sơn Lộc", "Phường Trung Hưng", "Phường Trung Sơn Trầm", "Xã Cổ Đông", "Xã Đường Lâm", "Xã Kim Sơn", "Xã Sơn Đông", "Xã Thanh Mỹ", "Xã Xuân Khanh", "Xã Đường Lâm"] },
      { name: "Huyện Đông Anh", wards: ["Thị trấn Đông Anh", "Xã Bắc Hồng", "Xã Cổ Loa", "Xã Dục Tú", "Xã Đại Mạch", "Xã Đông Hội", "Xã Hải Bối", "Xã Kim Chung", "Xã Kim Nỗ", "Xã Liên Hà", "Xã Mai Lâm", "Xã Nam Hồng", "Xã Nguyên Khê", "Xã Tầm Xá", "Yên Thường", "Xã Thụy Lâm", "Xã Tiên Dương", "Xã Uy Nỗ", "Xã Vân Hà", "Xã Vân Nội", "Xã Việt Hùng", "Xã Vĩnh Ngọc", "Xã Võng La", "Xã Xuân Canh"] },
      { name: "Huyện Gia Lâm", wards: ["Thị trấn Yên Viên", "Thị trấn Trâu Quỳ", "Xã Bát Tràng", "Xã Cổ Bi", "Xã Đa Tốn", "Xã Đặng Xá", "Xã Đình Xuyên", "Xã Đông Dư", "Xã Dương Hà", "Xã Dương Quang", "Xã Dương Xá", "Xã Kiêu Kỵ", "Xã Kim Lan", "Xã Kim Sơn", "Xã Lệ Chi", "Xã Ninh Hiệp", "Xã Phù Đổng", "Xã Phú Thị", "Xã Trung Mầu", "Xã Văn Đức", "Xã Yên Thường", "Xã Yên Viên"] },
      { name: "Huyện Thanh Trì", wards: ["Thị trấn Văn Điển", "Xã Đại Áng", "Xã Đông Mỹ", "Xã Duyên Hà", "Xã Hữu Hòa", "Xã Liên Ninh", "Xã Ngọc Hồi", "Xã Ngũ Hiệp", "Xã Tả Thanh Oai", "Xã Tam Hiệp", "Xã Tân Triều", "Xã Thanh Liệt", "Xã Tứ Hiệp", "Xã Vạn Phúc", "Xã Vĩnh Quỳnh", "Xã Yên Mỹ"] }
    ]
  },
  {
    name: "Đà Nẵng",
    districts: [
      { name: "Quận Hải Châu", wards: ["Phường Bình Hiên", "Phường Bình Thuận", "Phường Hòa Cường Bắc", "Phường Hòa Cường Nam", "Phường Hòa Thuận Đông", "Phường Hòa Thuận Tây", "Phường Nam Dương", "Phường Phước Ninh", "Phường Thạch Thang", "Phường Thanh Bình", "Phường Thuận Phước"] },
      { name: "Quận Thanh Khê", wards: ["Phường An Khê", "Phường Chính Gián", "Phường Hòa Khê", "Phường Tam Thuận", "Phường Tân Chính", "Phường Thạc Gián", "Phường Thanh Khê Đông", "Phường Thanh Khê Tây", "Phường Xuân Hà"] },
      { name: "Quận Sơn Trà", wards: ["Phường An Hải Bắc", "Phường An Hải Đông", "Phường An Hải Tây", "Phường Mân Thái", "Phường Nại Hiên Đông", "Phường Phước Mỹ", "Phường Thọ Quang"] },
      { name: "Quận Ngũ Hành Sơn", wards: ["Phường Hòa Hải", "Phường Hòa Quý", "Phường Khuê Mỹ", "Phường Mỹ An"] },
      { name: "Quận Liên Chiểu", wards: ["Phường Hòa Hiệp Bắc", "Phường Hòa Hiệp Nam", "Phường Hòa Khánh Bắc", "Phường Hòa Khánh Nam", "Phường Hòa Minh"] },
      { name: "Quận Cẩm Lệ", wards: ["Phường Hòa An", "Phường Hòa Phát", "Phường Hòa Thọ Đông", "Phường Hòa Thọ Tây", "Phường Hòa Xuân", "Phường Khuê Trung"] },
      { name: "Huyện Hòa Vang", wards: ["Xã Hòa Bắc", "Xã Hòa Châu", "Xã Hòa Khương", "Xã Hòa Liên", "Xã Hòa Nhơn", "Xã Hòa Phong", "Xã Hòa Phú", "Xã Hòa Phước", "Xã Hòa Sơn", "Xã Hòa Tiến", "Xã Hòa Ninh"] }
    ]
  },
  {
    name: "Bình Dương",
    districts: [
      { name: "Thành phố Thủ Dầu Một", wards: ["Phường Phú Cường", "Phường Hiệp Thành", "Phường Chánh Nghĩa", "Phường Phú Thọ", "Phường Phú Hòa", "Phường Phú Lợi", "Phường Phú Mỹ", "Phường Định Hòa", "Phường Hiệp An", "Phường Tương Bình Hiệp", "Phường Chánh Mỹ", "Phường Tân An", "Phường Hòa Phú", "Phường Phú Tân"] },
      { name: "Thành phố Thuận An", wards: ["Phường Lái Thiêu", "Phường An Thạnh", "Phường Vĩnh Phú", "Phường Bình Hòa", "Phường Bình Chuẩn", "Phường Thuận Giao", "Phường An Phú", "Phường Bình Nhâm", "Phường Hưng Định", "Xã An Sơn"] },
      { name: "Thành phố Dĩ An", wards: ["Phường Dĩ An", "Phường Tân Đông Hiệp", "Phường Đông Hòa", "Phường Tân Bình", "Phường Bình An", "Phường Bình Thắng", "Phường An Bình"] },
      { name: "Thành phố Bến Cát", wards: ["Phường Mỹ Phước", "Phường Hòa Lợi", "Phường Thới Hòa", "Phường Tân Định", "Phường Chánh Phú Hòa", "Phường An Tây", "Phường An Điền", "Xã Phú An"] },
      { name: "Thành phố Tân Uyên", wards: ["Phường Uyên Hưng", "Phường Khánh Bình", "Phường Tân Phước Khánh", "Phường Thái Hòa", "Phường Thạnh Phước", "Phường Tân Hiệp", "Phường Hội Nghĩa", "Phường Vĩnh Tân", "Phường Phú Chánh", "Xã Bạch Đằng", "Xã Thạnh Hội"] }
    ]
  },
  {
    name: "Đồng Nai",
    districts: [
      { name: "Thành phố Biên Hòa", wards: ["Phường An Bình", "Phường An Hòa", "Phường Bình Đa", "Phường Bửu Long", "Phường Hiệp Hòa", "Phường Hóa An", "Phường Hòa Bình", "Phường Hố Nai", "Phường Long Bình", "Phường Long Bình Tân", "Phường Phước Tân", "Phường Quang Vinh", "Phường Quyết Thắng", "Phường Tam Hiệp", "Phường Tam Hòa", "Phường Tân Biên", "Phường Tân Hạnh", "Phường Tân Hòa", "Phường Tân Hiệp", "Phường Tân Mai", "Phường Tân Phong", "Phường Tân Tiến", "Phường Tân Vạn", "Phường Thanh Bình", "Phường Thống Nhất", "Phường Trảng Dài", "Phường Trung Dũng"] },
      { name: "Thành phố Long Khánh", wards: ["Phường Xuân Trung", "Phường Xuân Thanh", "Phường Xuân An", "Phường Xuân Bình", "Phường Xuân Hòa", "Phường Phú Bình", "Phường Bảo Vinh", "Phường Suối Tre", "Phường Xuân Lập", "Phường Bàu Sen", "Phường Xuân Tân", "Xã Bảo Quang", "Xã Bàu Trâm", "Xã Bình Lộc", "Xã Hàng Gòn"] },
      { name: "Huyện Long Thành", wards: ["Thị trấn Long Thành", "Xã An Phước", "Xã Bàu Cạn", "Xã Bình An", "Xã Bình Sơn", "Xã Cẩm Đường", "Xã Lộc An", "Xã Long An", "Xã Long Đức", "Xã Long Phước", "Xã Phước Bình", "Xã Phước Thái", "Xã Tam An", "Xã Tân Hiệp"] },
      { name: "Huyện Nhơn Trạch", wards: ["Xã Phước Thiền", "Xã Hiệp Phước", "Xã Phú Hội", "Xã Long Thọ", "Xã Long Tân", "Xã Phú Thạnh", "Xã Đại Phước", "Xã Phú Hữu", "Xã Phú Đông", "Xã Phước Khánh", "Xã Vĩnh Thanh", "Xã Phước An"] }
    ]
  },
  {
    name: "Cần Thơ",
    districts: [
      { name: "Quận Ninh Kiều", wards: ["Phường Tân An", "Phường An Hội", "Phường An Lạc", "Phường An Cư", "Phường An Nghiệp", "Phường An Phú", "Phường An Khánh", "Phường Xuân Khánh", "Phường Hưng Lợi", "Phường An Bình", "Phường Thới Bình"] },
      { name: "Quận Cái Răng", wards: ["Phường Lê Bình", "Phường Hưng Thạnh", "Phường Hưng Phú", "Phường Ba Láng", "Phường Thường Thạnh", "Phường Phú Thứ", "Phường Tân Phú"] },
      { name: "Quận Bình Thủy", wards: ["Phường Bình Thủy", "Phường Trà An", "Phường Trà Nóc", "Phường Thới An Đông", "Phường An Thới", "Phường Bùi Hữu Nghĩa", "Phường Long Hòa", "Phường Long Tuyền"] },
      { name: "Quận Ô Môn", wards: ["Phường Châu Văn Liêm", "Phường Thới Hòa", "Phường Thới Long", "Phường Long Hưng", "Phường Thới An", "Phường Phước Thới"] }
    ]
  },
  {
    name: "Khánh Hòa",
    districts: [
      { name: "Thành phố Nha Trang", wards: ["Phường Vĩnh Hải", "Phường Vĩnh Phước", "Phường Vĩnh Thọ", "Phường Xương Huân", "Phường Vạn Thạnh", "Phường Vạn Thắng", "Phường Phương Sài", "Phường Phương Sơn", "Phường Ngọc Hiệp", "Phường Phước Tiến", "Phường Phước Tân", "Phường Phước Hải", "Phường Phước Long", "Phường Vĩnh Nguyên", "Phường Vĩnh Trường", "Phường Lộc Thọ", "Phường Tân Lập"] },
      { name: "Thành phố Cam Ranh", wards: ["Phường Ba Ngòi", "Phường Cam Linh", "Phường Cam Lộc", "Phường Cam Lợi", "Phường Cam Nghĩa", "Phường Cam Phú", "Phường Cam Thuận", "Phường Cam Phúc Nam", "Phường Cam Phúc Bắc"] },
      { name: "Huyện Diên Khánh", wards: ["Thị trấn Diên Khánh", "Xã Diên An", "Xã Diên Toàn", "Xã Diên Thạnh", "Xã Diên Lạc", "Xã Diên Phú", "Xã Diên Phước", "Xã Diên Lâm"] }
    ]
  },
  {
    name: "Hải Phòng",
    districts: [
      { name: "Quận Hồng Bàng", wards: ["Phường Sở Dầu", "Phường Quán Toan", "Phường Hùng Vương", "Phường Thượng Lý", "Phường Hạ Lý", "Phường Minh Khai", "Phường Hoàng Văn Thụ", "Phường Phan Bội Châu"] },
      { name: "Quận Ngô Quyền", wards: ["Phường Máy Chai", "Phường Máy Tơ", "Phường Vạn Mỹ", "Phường Cầu Tre", "Phường Lạc Viên", "Phường Gia Viên", "Phường Đông Khê", "Phường Đằng Giang", "Phường Lạch Tray"] },
      { name: "Quận Lê Chân", wards: ["Phường Cát Dài", "Phường An Biên", "Phường Hàng Kênh", "Phường Dư Hàng", "Phường Dư Hàng Kênh", "Phường Nghĩa Xá", "Phường Niệm Nghĩa", "Phường Kênh Dương", "Phường Vĩnh Niệm"] }
    ]
  },
  {
    name: "Thừa Thiên Huế",
    districts: [
      { name: "Thành phố Huế", wards: ["Phường Thuận Hòa", "Phường Thuận Thành", "Phường Tây Lộc", "Phường Kim Long", "Phường Phú Hiệp", "Phường Phú Cát", "Phường Phú Hiệp", "Phường Vĩnh Ninh", "Phường Phú Nhuận", "Phường Phước Vĩnh", "Phường Phú Hội", "Phường Trường An", "Phường An Cựu", "Phường Xuân Phú", "Phường Vỹ Dạ"] }
    ]
  },
  {
    name: "An Giang",
    districts: [
      { name: "Thành phố Long Xuyên", wards: ["Phường Mỹ Bình", "Phường Mỹ Long", "Phường Mỹ Thạnh", "Phường Mỹ Thới", "Phường Mỹ Quý", "Phường Mỹ Phước", "Phường Đông Xuyên", "Phường Bình Đức", "Phường Bình Khánh"] }
    ]
  },
  {
    name: "Bà Rịa - Vũng Tàu",
    districts: [
      { name: "Thành phố Vũng Tàu", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12", "Phường Thắng Nhất", "Phường Thắng Nhì", "Phường Thắng Tam", "Phường Rạch Dừa", "Phường Nguyễn An Ninh", "Xã Long Sơn"] },
      { name: "Thành phố Bà Rịa", wards: ["Phường Phước Hiệp", "Phường Phước Hưng", "Phường Phước Trung", "Phường Phước Nguyên", "Phường Long Toàn", "Phường Long Hương", "Phường Long Tâm", "Phường Kim Dinh", "Xã Hòa Long", "Xã Long Phước", "Xã Tân Hưng"] }
    ]
  },
  {
    name: "Bắc Giang",
    districts: [{ name: "Thành phố Bắc Giang", wards: ["Phường Trần Phú", "Phường Ngô Quyền", "Phường Lê Lợi", "Phường Hoàng Văn Thụ", "Phường Thọ Xương", "Phường Mỹ Độ"] }]
  },
  {
    name: "Bắc Kạn",
    districts: [{ name: "Thành phố Bắc Kạn", wards: ["Phường Nguyễn Thị Minh Khai", "Phường Sông Cầu", "Phường Phùng Chí Kiên", "Phường Đức Xuân"] }]
  },
  {
    name: "Bạc Liêu",
    districts: [{ name: "Thành phố Bạc Liêu", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 5", "Phường 7", "Phường Nhà Mát"] }]
  },
  {
    name: "Bắc Ninh",
    districts: [{ name: "Thành phố Bắc Ninh", wards: ["Phường Đại Phúc", "Phường Đáp Cầu", "Phường Hạp Lĩnh", "Phường Khắc Niệm", "Phường Khương Tự", "Phường Kinh Bắc", "Phường Suối Hoa", "Phường Tiền An", "Phường Vạn An", "Phường Vân Dương", "Phường Vệ An", "Phường Võ Cường"] }]
  },
  {
    name: "Bến Tre",
    districts: [{ name: "Thành phố Bến Tre", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường Phú Khương", "Phường Phú Tân"] }]
  },
  {
    name: "Bình Định",
    districts: [{ name: "Thành phố Quy Nhơn", wards: ["Phường Bùi Thị Xuân", "Phường Đống Đa", "Phường Ghềnh Ráng", "Phường Hải Cảng", "Phường Lê Hồng Phong", "Phường Lê Lợi", "Phường Lý Thường Kiệt", "Phường Ngô Mây", "Phường Nguyễn Văn Cừ", "Phường Nhơn Bình", "Phường Nhơn Phú", "Phường Quang Trung", "Phường Thị Nại", "Phường Trần Hưng Đạo", "Phường Trần Phú", "Phường Trần Quang Diệu"] }]
  },
  {
    name: "Bình Phước",
    districts: [{ name: "Thành phố Đồng Xoài", wards: ["Phường Tân Bình", "Phường Tân Phú", "Phường Tân Đồng", "Phường Tân Xuân", "Phường Tân Thiện", "Phường Tiến Thành"] }]
  },
  {
    name: "Bình Thuận",
    districts: [{ name: "Thành phố Phan Thiết", wards: ["Phường Mũi Né", "Phường Hàm Tiến", "Phường Phú Hài", "Phường Thanh Hải", "Phường Phú Thủy", "Phường Phú Trinh", "Phường Xuân An", "Phường Bình Hưng", "Phường Đức Nghĩa", "Phường Đức Thắng", "Phường Lạc Đạo", "Phường Đức Long", "Phường Hưng Long", "Phường Phú Tài"] }]
  },
  {
    name: "Cà Mau",
    districts: [{ name: "Thành phố Cà Mau", wards: ["Phường 1", "Phường 2", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường Tân Xuyên", "Phường Tân Thành"] }]
  },
  {
    name: "Cao Bằng",
    districts: [{ name: "Thành phố Cao Bằng", wards: ["Phường Hợp Giang", "Phường Sông Hiến", "Phường Sông Bằng", "Phường Ngọc Xuân", "Phường Đề Thám"] }]
  },
  {
    name: "Đắk Lắk",
    districts: [{ name: "Thành phố Buôn Ma Thuột", wards: ["Phường Tân Ti tiến", "Phường Thành Công", "Phường Thắng Lợi", "Phường Thống Nhất", "Phường Tân Lợi", "Phường Tân Lập", "Phường Tân Hòa", "Phường Tân Thành", "Phường Khánh Xuân", "Phường Tự An", "Phường Ea Tam"] }]
  },
  {
    name: "Đắk Nông",
    districts: [{ name: "Thành phố Gia Nghĩa", wards: ["Phường Nghĩa Đức", "Phường Nghĩa Thành", "Phường Nghĩa Phú", "Phường Nghĩa Trung", "Phường Nghĩa Tân"] }]
  },
  {
    name: "Điện Biên",
    districts: [{ name: "Thành phố Điện Biên Phủ", wards: ["Phường Mường Thanh", "Phường Tân Thanh", "Phường Him Lam", "Phường Thanh Bình", "Phường Nam Thanh"] }]
  },
  {
    name: "Đồng Tháp",
    districts: [{ name: "Thành phố Cao Lãnh", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 6", "Phường 11", "Phường Hòa Thuận", "Phường Mỹ Phú"] }]
  },
  {
    name: "Gia Lai",
    districts: [{ name: "Thành phố Pleiku", wards: ["Phường Yên Đỗ", "Phường Diên Hồng", "Phường Tây Sơn", "Phường Thống Nhất", "Phường Hội Thương", "Phường Hoa Lư", "Phường Phù Đổng", "Phường Trà Bá"] }]
  },
  {
    name: "Hà Giang",
    districts: [{ name: "Thành phố Hà Giang", wards: ["Phường Trần Phú", "Phường Minh Khai", "Phường Nguyễn Trãi", "Phường Quang Trung", "Phường Ngọc Hà"] }]
  },
  {
    name: "Hà Nam",
    districts: [{ name: "Thành phố Phủ Lý", wards: ["Phường Minh Khai", "Phường Hai Bà Trưng", "Phường Lương Khánh Thiện", "Phường Trần Hưng Đạo", "Phường Liêm Chính"] }]
  },
  {
    name: "Hà Tĩnh",
    districts: [{ name: "Thành phố Hà Tĩnh", wards: ["Phường Bắc Hà", "Phường Nam Hà", "Phường Nguyễn Du", "Phường Trần Phú", "Phường Thạch Quý"] }]
  },
  {
    name: "Hải Dương",
    districts: [{ name: "Thành phố Hải Dương", wards: ["Phường Trần Hưng Đạo", "Phường Quang Trung", "Phường Nguyễn Trãi", "Phường Phạm Ngũ Lão", "Phường Lê Thanh Nghị", "Phường Hải Tân"] }]
  },
  {
    name: "Hậu Giang",
    districts: [{ name: "Thành phố Vị Thanh", wards: ["Phường 1", "Phường 3", "Phường 4", "Phường 5", "Phường 7"] }]
  },
  {
    name: "Hòa Bình",
    districts: [{ name: "Thành phố Hòa Bình", wards: ["Phường Phương Lâm", "Phường Đồng Tiến", "Phường Hữu Nghị", "Phường Chăm Mát"] }]
  },
  {
    name: "Hưng Yên",
    districts: [{ name: "Thành phố Hưng Yên", wards: ["Phường Hiến Nam", "Phường Lê Lợi", "Phường Quang Trung", "Phường Minh Khai", "Phường Lam Sơn"] }]
  },
  {
    name: "Kiên Giang",
    districts: [{ name: "Thành phố Rạch Giá", wards: ["Phường Vĩnh Thanh Vân", "Phường Vĩnh Thanh", "Phường Vĩnh Lạc", "Phường Vĩnh Bảo", "Phường Vĩnh Lợi", "Phường Rạch Sỏi", "Phường An Hòa", "Phường An Bình"] }]
  },
  {
    name: "Kon Tum",
    districts: [{ name: "Thành phố Kon Tum", wards: ["Phường Quang Trung", "Phường Quyết Thắng", "Phường Thống Nhất", "Phường Thắng Lợi", "Phường Trần Hưng Đạo"] }]
  },
  {
    name: "Lai Châu",
    districts: [{ name: "Thành phố Lai Châu", wards: ["Phường Quyết Thắng", "Phường Tân Phong", "Phường Quyết Tiến", "Phường Đông Phong"] }]
  },
  {
    name: "Lâm Đồng",
    districts: [{ name: "Thành phố Đà Lạt", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường 11", "Phường 12"] }]
  },
  {
    name: "Lạng Sơn",
    districts: [{ name: "Thành phố Lạng Sơn", wards: ["Phường Hoàng Văn Thụ", "Phường Tam Thanh", "Phường Vĩnh Trại", "Phường Chi Lăng"] }]
  },
  {
    name: "Lào Cai",
    districts: [{ name: "Thành phố Lào Cai", wards: ["Phường Lào Cai", "Phường Phố Mới", "Phường Cốc Lếu", "Phường Kim Tân", "Phường Bắc Cường", "Phường Nam Cường"] }]
  },
  {
    name: "Long An",
    districts: [{ name: "Thành phố Tân An", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường Khánh Hậu"] }]
  },
  {
    name: "Nam Định",
    districts: [{ name: "Thành phố Nam Định", wards: ["Phường Giao Quang", "Phường Trần Hưng Đạo", "Phường Phan Đình Phùng", "Phường Nguyễn Du", "Phường Vị Hoàng", "Phường Vị Xuyên"] }]
  },
  {
    name: "Nghệ An",
    districts: [{ name: "Thành phố Vinh", wards: ["Phường Lê Lợi", "Phường Quang Trung", "Phường Hưng Bình", "Phường Trường Thi", "Phường Bến Thủy", "Phường Cửa Nam"] }]
  },
  {
    name: "Ninh Bình",
    districts: [{ name: "Thành phố Ninh Bình", wards: ["Phường Vân Giang", "Phường Thanh Bình", "Phường Đông Thành", "Phường Tân Thành", "Phường Nam Bình"] }]
  },
  {
    name: "Ninh Thuận",
    districts: [{ name: "Thành phố Phan Rang - Tháp Chàm", wards: ["Phường Mỹ Hương", "Phường Tấn Tài", "Phường Thanh Sơn", "Phường Kinh Dinh", "Phường Phủ Hà", "Phường Đô Vinh"] }]
  },
  {
    name: "Phú Thọ",
    districts: [{ name: "Thành phố Việt Trì", wards: ["Phường Bạch Hạc", "Phường Thanh Miếu", "Phường Thọ Sơn", "Phường Tiên Cát", "Phường Nông Trang", "Phường Gia Cẩm"] }]
  },
  {
    name: "Quảng Bình",
    districts: [{ name: "Thành phố Đồng Hới", wards: ["Phường Đồng Mỹ", "Phường Hải Đình", "Phường Ba Đồn", "Phường Đồng Sơn", "Phường Hải Thành", "Phường Nam Lý"] }]
  },
  {
    name: "Quảng Nam",
    districts: [{ name: "Thành phố Tam Kỳ", wards: ["Phường An Mỹ", "Phường An Sơn", "Phường Tân Thạnh", "Phường Hòa Hương", "Phường Phước Hòa"] }]
  },
  {
    name: "Quảng Ngãi",
    districts: [{ name: "Thành phố Quảng Ngãi", wards: ["Phường Nguyễn Nghiêm", "Phường Trần Hưng Đạo", "Phường Chánh Lộ", "Phường Nghĩa Chánh", "Phường Quảng Phú"] }]
  },
  {
    name: "Quảng Ninh",
    districts: [{ name: "Thành phố Hạ Long", wards: ["Phường Bạch Đằng", "Phường Hồng Gai", "Phường Hồng Hà", "Phường Cao Thắng", "Phường Giếng Đáy", "Phường Bãi Cháy"] }]
  },
  {
    name: "Quảng Trị",
    districts: [{ name: "Thành phố Đông Hà", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5"] }]
  },
  {
    name: "Sóc Trăng",
    districts: [{ name: "Thành phố Sóc Trăng", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10"] }]
  },
  {
    name: "Sơn La",
    districts: [{ name: "Thành phố Sơn La", wards: ["Phường Chiềng Lề", "Phường Tô Hiệu", "Phường Quyết Thắng", "Phường Quyết Tiến"] }]
  },
  {
    name: "Tây Ninh",
    districts: [{ name: "Thành phố Tây Ninh", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường Hiệp Ninh"] }]
  },
  {
    name: "Thái Bình",
    districts: [{ name: "Thành phố Thái Bình", wards: ["Phường Lê Hồng Phong", "Phường Bồ Xuyên", "Phường Kỳ Bá", "Phường Đề Thám", "Phường Quang Trung"] }]
  },
  {
    name: "Thái Nguyên",
    districts: [{ name: "Thành phố Thái Nguyên", wards: ["Phường Trưng Vương", "Phường Phan Đình Phùng", "Phường Quang Trung", "Phường Hoàng Văn Thụ", "Phường Gia Sàng"] }]
  },
  {
    name: "Thanh Hóa",
    districts: [{ name: "Thành phố Thanh Hóa", wards: ["Phường Ba Đình", "Phường Lam Sơn", "Phường Ngọc Trạo", "Phường Đông Thọ", "Phường Tân Sơn", "Phường Trường Thi"] }]
  },
  {
    name: "Tiền Giang",
    districts: [{ name: "Thành phố Mỹ Tho", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường 10", "Phường Tân Long"] }]
  },
  {
    name: "Trà Vinh",
    districts: [{ name: "Thành phố Trà Vinh", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9"] }]
  },
  {
    name: "Tuyên Quang",
    districts: [{ name: "Thành phố Tuyên Quang", wards: ["Phường Phan Thiết", "Phường Minh Xuân", "Phường Tân Quang", "Phường Ỷ La"] }]
  },
  {
    name: "Vĩnh Long",
    districts: [{ name: "Thành phố Vĩnh Long", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 8", "Phường 9"] }]
  },
  {
    name: "Vĩnh Phúc",
    districts: [{ name: "Thành phố Vĩnh Yên", wards: ["Phường Liên Bảo", "Phường Tích Sơn", "Phường Ngô Quyền", "Phường Đống Đa", "Phường Đồng Tâm"] }]
  },
  {
    name: "Yên Bái",
    districts: [{ name: "Thành phố Yên Bái", wards: ["Phường Hồng Hà", "Phường Nguyễn Thái Học", "Phường Yên Thịnh", "Phường Đồng Tâm"] }]
  },
  {
    name: "Phú Yên",
    districts: [{ name: "Thành phố Tuy Hòa", wards: ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8", "Phường 9", "Phường Phú Đông"] }]
  }
];

export const getProvinceList = () => VN_PROVINCES.map((p) => p.name);

export const getDistrictsOf = (provinceName: string) => {
  const prov = VN_PROVINCES.find((p) => p.name === provinceName);
  return prov ? prov.districts.map((d) => d.name) : [];
};

export const getWardsOf = (provinceName: string, districtName: string) => {
  const prov = VN_PROVINCES.find((p) => p.name === provinceName);
  if (!prov) return [];
  const dist = prov.districts.find((d) => d.name === districtName);
  return dist ? dist.wards : [];
};
