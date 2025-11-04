import React from "react";

export default function Contact() {
  return (
    <section className="s-contact flat-spacing-13">
      <div className="container">
        <div className="row">
          {/* MAP */}
          <div className="col-lg-12">
            <div className="wg-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27294.62418958524!2d151.25730233429948!3d-33.82005608618041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b12ab8bc95a137f%3A0x358f04a7f6f5f6a6!2sGrotto%20Point%20Lighthouse!5e0!3m2!1sen!2s!4v1733976867160!5m2!1sen!2s"
                className="map"
                style={{ border: "none" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* LEFT SIDE: CONTACT INFO */}
          <div className="col-lg-6">
            <div className="content-left">
              <div className="title fw-medium display-md-2">Contact Us</div>
              <p className="sub-title text-main">
                Have a question? Please contact us using the customer support
                <br />
                channels below.
              </p>

              <ul className="contact-list">
                <li>
                  <p>
                    Address:{" "}
                    <a
                      className="link"
                      href="https://www.google.com/maps?q=15Yarranst,Punchbowl,NSW,Australia"
                      target="_blank"
                      rel="noreferrer"
                    >
                      15 Yarran st, Punchbowl, NSW, Australia
                    </a>
                  </p>
                </li>

                <li>
                  <p>
                    Phone number:{" "}
                    <a className="link" href="tel:123456">
                      +1 234 567
                    </a>
                  </p>
                </li>

                <li>
                  <p>
                    Email:{" "}
                    <a className="link" href="mailto:contact@vineta.com">
                      contact@vineta.com
                    </a>
                  </p>
                </li>

                <li>
                  <p>
                    Open:{" "}
                    <span className="text-main"> 8am - 7pm, Mon - Sat </span>
                  </p>
                </li>
              </ul>

              <ul className="tf-social-icon style-large">
                <li>
                  <a
                    href="https://www.facebook.com/"
                    className="social-item social-facebook"
                  >
                    <i className="icon icon-fb" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/"
                    className="social-item social-instagram"
                  >
                    <i className="icon icon-instagram" />
                  </a>
                </li>
                <li>
                  <a href="https://x.com/" className="social-item social-x">
                    <i className="icon icon-x" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.snapchat.com/"
                    className="social-item social-snapchat"
                  >
                    <i className="icon icon-snapchat" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE: MESSAGE FORM */}
          <div className="col-lg-6">
            <div className="content-right">
              <div className="title fw-medium display-md-2">Get In Touch</div>
              <p className="sub-title text-main">
                Please submit&nbsp;all general enquiries&nbsp;in the contact
                form below and we look forward to hearing from you soon.
              </p>

              <div className="form-contact-wrap">
                <form action="#" className="form-default">
                  <div className="wrap">
                    <div className="cols">
                      <fieldset>
                        <label htmlFor="username">Your name*</label>
                        <input
                          id="username"
                          type="text"
                          name="username"
                          required
                        />
                      </fieldset>

                      <fieldset>
                        <label htmlFor="email">Your email*</label>
                        <input id="email" type="email" name="email" required />
                      </fieldset>
                    </div>

                    <div className="cols">
                      <fieldset className="textarea">
                        <label htmlFor="mess">Message</label>
                        <textarea id="mess" required defaultValue={""} />
                      </fieldset>
                    </div>

                    <div className="button-submit">
                      <button className="tf-btn animate-btn" type="submit">
                        Send
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
          {/* END RIGHT SIDE */}
        </div>
      </div>
    </section>
  );
}
