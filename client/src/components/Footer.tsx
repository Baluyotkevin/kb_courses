import Link from 'next/link';
import React from 'react'

const Footer = () => {
  return (
    <div className="footer">
        <p>&copy; 2024 KBCourses. All Rights Reserved.</p>
        <div className="footer__links">
            {["About", "Privacy Policy", "Licensing", "Contact"].map((item) => (
                <Link scroll={false} className="footer__link" key={item} href={`/${item.toLowerCase().replace(" ", "-")}`}>
                    {item}
                </Link>
            ))}
        </div>
    </div>
  );
};

export default Footer;