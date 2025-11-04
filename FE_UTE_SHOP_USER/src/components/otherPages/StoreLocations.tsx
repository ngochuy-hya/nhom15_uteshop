import React from "react";

export default function StoreLocations() {
  return (
    <section className="s-store-location flat-spacing-13">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="wg-map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d27294.62418958524!2d151.25730233429948!3d-33.82005608618041!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6b12ab8bc95a137f%3A0x358f04a7f6f5f6a6!2sGrotto%20Point%20Lighthouse!5e0!3m2!1sen!2s!4v1733976867160!5m2!1sen!2s"
                width="100%"
                height="589"
                style={{ border: "none" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="store-map"
              />
            </div>
            <div className="tf-grid-layout lg-col-3 sm-col-2">
              {[
                { title: "Store 1 Sydney" },
                { title: "Store 2 Melbourne" },
                { title: "Store 3 Canberra" },
                { title: "Store 4 Brisbane" },
                { title: "Store 5 Perth" },
              ].map((store, idx) => (
                <div className="box-store" key={idx}>
                  <div className="content">
                    <p className="title">{store.title}</p>
                    <ul className="contact-list">
                      <li>
                        <p>
                          Address:{" "}
                          <a
                            className="link"
                            href="https://www.google.com/maps?q=15Yarranst,Punchbowl,NSW,Australia"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            15 Yarran st, Punchbowl, NSW, Australia
                          </a>
                        </p>
                      </li>
                      <li>
                        <p>
                          Phone number:{" "}
                          <a className="link" href="tel:+123456">
                            +1 234 567
                          </a>
                        </p>
                      </li>
                      <li>
                        <p>
                          Email:{" "}
                          <a
                            className="link"
                            href="mailto:contact@vineta.com"
                          >
                            contact@vineta.com
                          </a>
                        </p>
                      </li>
                      <li>
                        <p>
                          Open:{" "}
                          <span className="text-main">
                            8am - 7pm, Mon - Sat
                          </span>
                        </p>
                      </li>
                    </ul>
                  </div>
                  <div className="bot">
                    <a href="#" className="tf-btn btn-line">
                      Get direction
                      <i className="icon-arrow-top-left" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
