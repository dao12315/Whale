/**
 * Whale & GGC Studio Currency Formatting Utilities
 * Chuẩn hóa hiển thị tiền mặt Việt Nam Đồng (VND) và định dạng học phí trực tiếp
 */

export const formatVnd = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

export interface CourseVndPrices {
  originalVnd: number;
  goldVnd: number;
  supremeVnd: number;
  isFree: boolean;
  formattedOriginal: string;
  formattedGold: string;
  formattedSupreme: string;
}

/**
 * Tính toán và định dạng giá tiền thật VND của khóa học
 * - Nếu originalPrice = 0 hoặc isFree = true -> Miễn phí 100%
 * - Khóa học trả phí: Niêm yết trực tiếp bằng tiền mặt VND
 */
export const getCourseVndPrices = (course: {
  originalPrice?: number;
  goldPrice?: number;
  supremePrice?: number;
  priceVnd?: number | bigint;
  isFree?: boolean;
}): CourseVndPrices => {
  const isFree = course.isFree === true || course.originalPrice === 0;

  if (isFree) {
    return {
      originalVnd: 0,
      goldVnd: 0,
      supremeVnd: 0,
      isFree: true,
      formattedOriginal: 'Miễn phí',
      formattedGold: 'Miễn phí',
      formattedSupreme: 'Miễn phí',
    };
  }

  // Tỷ lệ quy đổi: 50 xu = 250.000 ₫ (mỗi credit tương ứng 5.000 ₫ hoặc dùng giá VND chuẩn)
  let baseVnd = 250000;
  if (course.priceVnd) {
    const rawVnd = Number(course.priceVnd);
    if (rawVnd >= 1000) baseVnd = rawVnd;
  } else if (course.originalPrice) {
    if (course.originalPrice >= 1000) {
      baseVnd = course.originalPrice;
    } else {
      baseVnd = course.originalPrice * 5000;
    }
  }

  // Chiết khấu hội viên: Gold giảm 10%, Supreme giảm 30%
  let goldVnd = Math.round(baseVnd * 0.9);
  if (course.goldPrice) {
    if (course.goldPrice >= 1000) goldVnd = course.goldPrice;
    else goldVnd = course.goldPrice * 5000;
  }

  let supremeVnd = Math.round(baseVnd * 0.7);
  if (course.supremePrice) {
    if (course.supremePrice >= 1000) supremeVnd = course.supremePrice;
    else supremeVnd = course.supremePrice * 5000;
  }

  return {
    originalVnd: baseVnd,
    goldVnd,
    supremeVnd,
    isFree: false,
    formattedOriginal: formatVnd(baseVnd),
    formattedGold: formatVnd(goldVnd),
    formattedSupreme: formatVnd(supremeVnd),
  };
};
