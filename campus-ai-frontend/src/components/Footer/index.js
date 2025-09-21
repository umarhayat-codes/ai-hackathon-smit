import React from 'react'

export default function Footer() {
  let year = new Date().getFullYear()
  return (
    <footer className='bg-primary py-2'>

            <div className="container">
                <div className="row">
                    <div className="col">
                        <p className="mb-0 text-center text-white">{year}&copy; copyright. All right reserve.</p>
                    </div>
                </div>
            </div>
    </footer>
  )
}

