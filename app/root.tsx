import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
} from "@remix-run/react";
import CSS from "./css/app.css"
import { Navbar, Dropdown } from "flowbite-react";

export const links: LinksFunction = () => [
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
  { rel: "stylesheet", href: CSS },
];

export default function App() {
  const navigate = useNavigate();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
      <Navbar
        fluid={true}
        rounded={true}
        >
        <Navbar.Brand href="/">
            <img
              src="/aocLogo.jpeg"
              className="w-20"
              alt="AoC Logo"
            />
            <span className="pl-10 self-center whitespace-nowrap text-xl font-semibold dark:text-white">
              Ben Schell's Advent of Code
            </span>
        </Navbar.Brand>
        <Navbar.Toggle />
            <div className="flex md:order-2">
              <Dropdown
                arrowIcon={true}
                inline
                label={
                  <span>2022</span>
                }
              >
                <Dropdown.Item as={Link} to="/2022/01">Day 01</Dropdown.Item>
              </Dropdown>
              <Dropdown
                arrowIcon={true}
                inline
                label={
                  <span>2023</span>
                }
              >
                <Dropdown.Item as={Link} to="/2023/00">Day 00 (Template)</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/01">Day 01</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/02">Day 02</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/03">Day 03</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/04">Day 04</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/05">Day 05</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/06">Day 06</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/07">Day 07</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/08">Day 08</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/09">Day 09</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/10">Day 10</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/11">Day 11</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/12">Day 12</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/13">Day 13</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/14">Day 14</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/15">Day 15</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/16">Day 16</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/17">Day 17</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/18">Day 18</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/19">Day 19</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/20">Day 20</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/21">Day 21</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/22">Day 22</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/23">Day 23</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/24">Day 24</Dropdown.Item>
                <Dropdown.Item as={Link} to="/2023/25">Day 25</Dropdown.Item>
              </Dropdown>
              <Navbar.Toggle />
            </div>
        </Navbar>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
