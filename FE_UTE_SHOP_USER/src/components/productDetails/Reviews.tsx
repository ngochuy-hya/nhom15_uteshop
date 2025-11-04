"use client";
import React from "react";
import { formatImageUrl } from "@/utlis/image.utils";

// Format date từ timestamp hoặc date string
const formatDate = (dateStr: string | Date): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                 day === 2 || day === 22 ? 'nd' : 
                 day === 3 || day === 23 ? 'rd' : 'th';
  return `${month} ${day}${suffix}, ${year}`;
};

// Tính rating breakdown từ reviews
const calculateRatingBreakdown = (reviews: any[]) => {
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((review) => {
    const rating = review.rating || 0;
    if (rating >= 1 && rating <= 5) {
      breakdown[rating as keyof typeof breakdown]++;
    }
  });
  const total = reviews.length || 1;
  return Object.keys(breakdown).map((star) => ({
    star: Number(star),
    count: breakdown[Number(star) as keyof typeof breakdown],
    percentage: (breakdown[Number(star) as keyof typeof breakdown] / total) * 100,
  }));
};

export default function Reviews({ product }: { product?: any }) {
  // Lấy reviews từ product, nếu không có thì dùng mảng rỗng
  const apiReviews = product?.reviews || [];
  const averageRating = product?.average_rating || 0;
  const reviewCount = product?.review_count || apiReviews.length || 0;

  // Map reviews từ API sang format component cần
  const reviews = apiReviews.map((review: any) => ({
    id: review.id,
    name: review.first_name && review.last_name 
      ? `${review.first_name} ${review.last_name}`
      : review.name || 'Anonymous',
    date: formatDate(review.created_at || review.date),
    avatar: formatImageUrl(review.avatar), // Chỉ dùng avatar từ API, không fallback
    rating: review.rating || 5,
    comment: review.comment || review.title || 'No comment',
    is_verified: review.is_verified || false,
  }));

  // Tính rating breakdown
  const ratingBreakdown = calculateRatingBreakdown(apiReviews);

  // Tính số sao đầy
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  return (
    <>
      <div className="review-heading">
        <h6 className="title">Customer review</h6>
        {reviewCount > 0 && (
          <div className="box-rate-review">
            <div className="rating-summary">
              <ul className="list-star">
                {[...Array(fullStars)].map((_, i) => (
                  <li key={`full-${i}`}>
                    <i className="icon icon-star" />
                  </li>
                ))}
                {hasHalfStar && (
                  <li>
                    <i className="icon icon-star" style={{ opacity: 0.5 }} />
                  </li>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                  <li key={`empty-${i}`}>
                    <i className="icon icon-star" style={{ opacity: 0.2 }} />
                  </li>
                ))}
                <li>
                  <span className="count-star text-md">({reviewCount})</span>
                </li>
              </ul>
              <span className="text-md rating-average">{averageRating.toFixed(1)}/5.0</span>
            </div>
            {ratingBreakdown.length > 0 && (
              <div className="rating-breakdown">
                {ratingBreakdown.reverse().map((item) => (
                  <div key={item.star} className="rating-breakdown-item">
                    <div className="rating-score">
                      {item.star} <i className="icon icon-star" />
                    </div>
                    <div className="rating-bar">
                      <div className="value" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <span className="rating-count">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <a href="#form-review" className="tf-btn btn-dark2 animate-btn">
          Write a review
        </a>
      </div>
      <div className="review-section">
        {reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((review) => (
            <li className="review-item" key={review.id}>
              <div className="review-avt">
                <img alt="avt" src={review.avatar} width={100} height={100} />
              </div>
              <div className="review-content">
                <div className="review-info">
                  <div className="review-meta">
                    <span className="review-author fw-medium text-md">
                      {review.name}
                      {review.is_verified && (
                        <span className="badge-verified ms-2" title="Verified Purchase">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="review-date text-sm">{review.date}</span>
                  </div>
                  <div className={`list-star star-${review.rating}`}>
                    {[...Array(5)].map((_, index) => (
                      <i 
                        key={index} 
                        className={`icon icon-star ${index < review.rating ? '' : ''}`}
                        style={{ opacity: index < review.rating ? 1 : 0.2 }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text text-sm text-main-4">{review.comment}</p>
              </div>
            </li>
          ))}
          </ul>
        ) : (
          <div className="review-empty">
            <p className="text-center text-main-4">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!</p>
          </div>
        )}
        <form
          id="form-review"
          onSubmit={(e) => e.preventDefault()}
          className="form-review"
        >
          <h6 className="title">Write a review</h6>
          <p className="note text-md text-main-4">
            Your email address will not be published.&nbsp;Required fields are
            marked&nbsp;*
          </p>
          <div className="box-rating">
            <span className="text-md">Your rating *</span>
            <div className="list-rating-check">
              <input type="radio" id="star5" name="rate" defaultValue={5} />
              <label htmlFor="star5" title="text" />
              <input type="radio" id="star4" name="rate" defaultValue={4} />
              <label htmlFor="star4" title="text" />
              <input type="radio" id="star3" name="rate" defaultValue={3} />
              <label htmlFor="star3" title="text" />
              <input type="radio" id="star2" name="rate" defaultValue={2} />
              <label htmlFor="star2" title="text" />
              <input type="radio" id="star1" name="rate" defaultValue={1} />
              <label htmlFor="star1" title="text" />
            </div>
          </div>
          <div className="group-2-ip">
            <input type="text" className="" placeholder="Name *" />
            <input type="email" className="" placeholder="Email *" />
          </div>
          <textarea
            name="note"
            id="note"
            placeholder="Your review *"
            defaultValue={""}
          />
          <div className="check-save">
            <input type="checkbox" className="tf-check" id="checksave" />
            <label htmlFor="checksave" className="label text-md">
              Save my name, email, and website in this browser for the next time
              I comment.
            </label>
          </div>
          <button type="submit" className="tf-btn animate-btn">
            Submit
          </button>
        </form>
      </div>
    </>
  );
}

