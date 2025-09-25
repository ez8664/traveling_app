import { Link, NavLink } from "react-router"
import { sidebarItems } from "~/constants"
import { cn } from "~/lib/utils"

const NavItems = () => {
  return (
    <section className="nav-items">
        <Link to='/' className="link-logo">
            <img src="/assets/icons/logo.svg" alt="logo" className="size-[30px]"/>
            <h1>Tourvisto</h1>
        </Link>

        <div className="container">
            <nav>
                {sidebarItems.map(({ id, href, icon, label }) => (
                    <NavLink to={href} key={id}>
                        {({ isActive }: { isActive: boolean }) => (
                            <div className={cn('group nav-item', {
                                'bg-primary-100 !text-white': isActive
                            })}>
                                <img 
                                    src={icon} 
                                    alt={label} 
                                    className={`group-hover:brightness-0 size-0 group-hover:invert ${isActive ? 'brightness-0 invert' : 'text-dark-200'}`}
                                />
                                {label}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>
        </div>
    </section>
  )
}

export default NavItems