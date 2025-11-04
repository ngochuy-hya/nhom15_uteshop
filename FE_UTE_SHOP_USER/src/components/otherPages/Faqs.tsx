import React from "react";
import { Link } from "react-router-dom";
export default function Faqs() {
  return (
    <section className="s-faq flat-spacing-13">
      <div className="container">
        <div className="row">
          <div className="col-lg-4">
            <div className="sb-contact">
              <p className="title">Contact Us</p>
              <p className="sub">
                If you have an issue or question that requires immediate
                assistance, you can click the button below to chat live with a
                Customer Service representative.
              </p>
              <p className="sub">
                Please allow 06 - 12 business days from the time your package
                arrives back to us for a refund to be issued.
              </p>
              <div className="btn-group">
                <Link
                  to={`/contact-us`}
                  className="tf-btn btn-fill hover-primary"
                >
                  Contact us
                </Link>
                <a href="#" className="tf-btn btn-white hover-primary">
                  Chat with us
                </a>
              </div>
            </div>
          </div>
          <div className="col-lg-8">
            <ul className="faq-list">
              <li className="faq-item">
                <p className="name-faq">Shopping Information</p>
                <div className="faq-wrap" id="accordionShoping">
                  <div className="widget-accordion">
                    <div
                      className="accordion-title"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseOne"
                      aria-expanded="true"
                      aria-controls="collapseOne"
                      role="button"
                    >
                      <span>How long will it take for my order to ship?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapseOne"
                      className="accordion-collapse collapse show"
                      aria-labelledby="headingOne"
                      data-bs-parent="#accordionShoping"
                    >
                      <div className="accordion-body widget-desc">
                        <p>
                          If you have an issue or question that requires
                          immediate assistance, you can click the button below
                          to chat live with a Customer Service representative.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="widget-accordion">
                    <div
                      className="accordion-title collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseTwo"
                      aria-expanded="false"
                      aria-controls="collapseTwo"
                      role="button"
                    >
                      <span>Do you offer free shipping?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapseTwo"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingTwo"
                      data-bs-parent="#accordionShoping"
                    >
                      <div className="accordion-body widget-material">
                        <p>
                          If you have an issue or question that requires
                          immediate assistance, you can click the button below
                          to chat live with a Customer Service representative.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="widget-accordion">
                    <div
                      className="accordion-title collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseThree"
                      aria-expanded="false"
                      aria-controls="collapseThree"
                      role="button"
                    >
                      <span>
                        Can I change my shipping address after placing an order?
                      </span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapseThree"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingThree"
                      data-bs-parent="#accordionShoping"
                    >
                      <div className="accordion-body">
                        <p>
                          If you have an issue or question that requires
                          immediate assistance, you can click the button below
                          to chat live with a Customer Service representative.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="widget-accordion">
                    <div
                      className="accordion-title collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseFour"
                      aria-expanded="false"
                      aria-controls="collapseFour"
                      role="button"
                    >
                      <span>What if my package is delayed or lost?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapseFour"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingFour"
                      data-bs-parent="#accordionShoping"
                    >
                      <div className="accordion-body">
                        <p>
                          If you have an issue or question that requires
                          immediate assistance, you can click the button below
                          to chat live with a Customer Service representative.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li className="faq-item">
                <p className="name-faq">Payment Information</p>
                <div className="faq-wrap" id="accordionPayment">
                  <div className="widget-accordion">
                    <div
                      className="accordion-title"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapsePaymentOne"
                      aria-expanded="true"
                      aria-controls="collapsePaymentOne"
                      role="button"
                    >
                      <span>How long will it take for my order to ship?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapsePaymentOne"
                      className="accordion-collapse collapse show"
                      aria-labelledby="headingOne"
                      data-bs-parent="#accordionPayment"
                    >
                      <div className="accordion-body widget-desc">
                        <p>
                          If you have an issue or question that requires
                          immediate assistance, you can click the button below
                          to chat live with a Customer Service representative.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="widget-accordion">
                    <div
                      className="accordion-title collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapsePaymentTwo"
                      aria-expanded="false"
                      aria-controls="collapsePaymentTwo"
                      role="button"
                    >
                      <span>Do you offer free shipping?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapsePaymentTwo"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingTwo"
                      data-bs-parent="#accordionPayment"
                    >
                      <div className="accordion-body widget-material">
                        <p>
                          If you have an issue or question that requires
                          immediate assistance, you can click the button below
                          to chat live with a Customer Service representative.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="widget-accordion">
                    <div
                      className="accordion-title collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapsePaymentThree"
                      aria-expanded="false"
                      aria-controls="collapsePaymentThree"
                      role="button"
                    >
                      <span>
                        Can I change my shipping address after placing an order?
                      </span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapsePaymentThree"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingThree"
                      data-bs-parent="#accordionPayment"
                    >
                      <div className="accordion-body">
                        <p>
                          If you have an issue or question that requires
                          immediate assistance, you can click the button below
                          to chat live with a Customer Service representative.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="widget-accordion">
                    <div
                      className="accordion-title collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapsePaymentFour"
                      aria-expanded="false"
                      aria-controls="collapsePaymentFour"
                      role="button"
                    >
                      <span>What if my package is delayed or lost?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapsePaymentFour"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingFour"
                      data-bs-parent="#accordionPayment"
                    >
                      <div className="accordion-body">
                        <p>
                          If you have an issue or question that requires
                          immediate assistance, you can click the button below
                          to chat live with a Customer Service representative.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              <li className="faq-item">
                <p className="name-faq">Return &amp; Exchange</p>
                <div className="faq-wrap" id="accordionExchange">
                  <div className="widget-accordion">
                    <div
                      className="accordion-title"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseExchangeOne"
                      aria-expanded="true"
                      aria-controls="collapseExchangeOne"
                      role="button"
                    >
                      <span>What is your return policy?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapseExchangeOne"
                      className="accordion-collapse collapse show"
                      aria-labelledby="headingOne"
                      data-bs-parent="#accordionExchange"
                    >
                      <div className="accordion-body widget-desc">
                        <p>
                          We accept returns within 14 days of delivery. Items
                          must be unworn, unwashed, and in their original
                          condition.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="widget-accordion">
                    <div
                      className="accordion-title collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseExchangeTwo"
                      aria-expanded="false"
                      aria-controls="collapseExchangeTwo"
                      role="button"
                    >
                      <span>How do I return an item?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapseExchangeTwo"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingTwo"
                      data-bs-parent="#accordionExchange"
                    >
                      <div className="accordion-body widget-material">
                        <p>
                          Simply contact our customer service team for a return
                          authorization, and we’ll provide instructions for
                          shipping the item back.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="widget-accordion">
                    <div
                      className="accordion-title collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseExchangeThree"
                      aria-expanded="false"
                      aria-controls="collapseExchangeThree"
                      role="button"
                    >
                      <span>Are there any items that cannot be returned?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapseExchangeThree"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingThree"
                      data-bs-parent="#accordionExchange"
                    >
                      <div className="accordion-body">
                        <p>
                          Yes, sale items, personalized products, and
                          undergarments are non-returnable.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="widget-accordion">
                    <div
                      className="accordion-title collapsed"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseExchangeFour"
                      aria-expanded="false"
                      aria-controls="collapseExchangeFour"
                      role="button"
                    >
                      <span>When will I receive my refund?</span>
                      <span className="icon icon-arrow-down" />
                    </div>
                    <div
                      id="collapseExchangeFour"
                      className="accordion-collapse collapse"
                      aria-labelledby="headingFour"
                      data-bs-parent="#accordionExchange"
                    >
                      <div className="accordion-body">
                        <p>
                          Once your return is received and inspected, we will
                          process the refund within 5-7 business days.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

