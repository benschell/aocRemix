import type { MetaFunction } from "@remix-run/node";
import { Tooltip, Button, Dropdown, Navbar, List } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Link, useNavigate } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }} className="container mx-auto"></div>
  );
}
