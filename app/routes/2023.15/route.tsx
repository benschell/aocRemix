import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 15;
const dayStr = `${dayNum}`.padStart(2, '0');
const slug = `2023.${dayStr}`;
const name = `Day ${dayStr}`;

export async function loader({}: LoaderFunctionArgs) {
  const __dirname = getDirname();
  const inputs = await fs.readdir(`${__dirname}/../app/routes/${slug}/inputs`);
  return json({
    inputs
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: name},
    { name: "description", content: name },
  ];
};

export default function Day00() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() || {output: '', rawInput: ''};
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }} className="container mx-auto">
      <h1>{name} <Link to={`https://adventofcode.com/2023/day/${dayNum}`} className="text-lg text-blue-600 hover:underline">Puzzle</Link></h1>

      <h2>Input:</h2>
      <Form method="post" className="flex max-w-md flex-col gap-4">
        <div>
          <div className="mb-2 block">
            <Label htmlFor="selected-input" value="Available File Inputs:" />
          </div>
          <Select name="selected-input">
            {data.inputs.map((input, index) => (
              <option key={`option-${index}`}>{input}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="raw-input" value="Raw Text Input:" />
          </div>
          <Textarea className="font-mono" name="raw-input" placeholder="(optionally) provide raw input here" rows={4} />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="input-one" value="Input One:" />
          </div>
          <TextInput className="font-mono" name="input-one" placeholder="(optionally) provide 'inputOne' here" />
        </div>
        <div>
          <div className="mb-2 block">
            <Label htmlFor="input-one" value="Input Two:" />
          </div>
          <TextInput className="font-mono" name="input-two" placeholder="(optionally) provide 'inputTwo' here" />
        </div>
        <Button type="submit">Submit</Button>
      </Form>

      <div  className="flex max-w-4xl flex-col gap-4 mt-10">
        <h2>Output:</h2>
        <Textarea className="font-mono" id="comment" value={actionData.output} readOnly rows={10} />
        <h3>From input:</h3>
        <Textarea className="font-mono" id="comment" value={actionData.rawInput} readOnly rows={10} />
      </div>
    </div>
  );
}

export async function action({
  request,
}: ActionFunctionArgs) {

  const __dirname = getDirname();

  const formData = await request.formData();
  const output: string[] = [];
  let rawInput = formData.get('raw-input') as string;
  const inputOne = formData.get('input-one') as string; 
  const inputTwo = formData.get('input-two') as string;
  if (!rawInput) {
    // Load the indicated file
    const inputFileName = formData.get('selected-input');

    // Read the json data file data.json
    rawInput = (await fs.readFile(`${__dirname}/../app/routes/${slug}/inputs/${inputFileName}`, "utf8")) as string;
  }

  const hash = (str: string) => {
    let currentValue = 0;
    for (let idx = 0; idx < str.length; idx++) {
      let num = str.charCodeAt(idx);
      currentValue = ((currentValue + num) * 17) % 256;
    }
    // output.push(`Hash for ${str} is ${currentValue}`);
    return currentValue;
  }
  hash('HASH');

  const parts = rawInput.split(',');
  let sum = 0;
  let map: {
    [key: number]: {name: string, lens: number}[]
  } = {};
  const printMap = () => {
    for (let i = 0; i < 256; i++) {
      if (map[i] && map[i].length) {
        output.push(`Box ${i}: ${map[i].map((lens) => `[${lens.name} ${lens.lens}]`)}`);
      }
    }
  };
  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx].trim();
    sum += hash(part);

    const num = parseInt(part[part.length-1]);
    if (!isNaN(num) && part[part.length-2] === '=') {
      // This is an =<num>

      // If there is already a lens in the box with the same label, replace the old lens with the new 
      // lens: remove the old lens and put the new lens in its place, not moving any other lenses 
      // in the box.
      // If there is not already a lens in the box with the same label, add the lens to the box 
      // immediately behind any lenses already in the box. Don't move any of the other lenses when you 
      // do this. If there aren't any lenses in the box, the new lens goes all the way to the front of 
      // the box.

      const partName = part.substring(0, part.length-2);
      const boxNum = hash(partName);
      output.push(`Setting ${partName} => ${boxNum} to ${num}`);
      if (map[boxNum]) {
        // Munge the array within if present
        const idxInBox = map[boxNum].reduce((priorVal, box, idx) => {
          if (box.name === partName) {
            // Found the box in the set
            return idx;
          }
          return priorVal;
        }, -1);
        output.push(`Found ${partName} in box ${boxNum} at index ${idxInBox}`);
        if (idxInBox !== -1) {
          // Change the value
          map[boxNum][idxInBox].lens = num;
        } else {
          // Append the lens
          map[boxNum].push({name: partName, lens: num});
        }
      } else {
        output.push(`That box doesn't exist, creating it`);
        map[boxNum] = [{name: partName, lens: num}];
      }

    } else if (part[part.length-1] === '-') {
      // go to the relevant box and remove the lens with the given label if it is present in the box. 
      // Then, move any remaining lenses as far forward in the box as they can go without changing 
      // their order, filling any space made by removing the indicated lens. (If no lens in that box 
      // has the given label, nothing happens.)
      const partName = part.substring(0, part.length-1);
      const boxNum = hash(partName);
      output.push(`Got ${partName} => ${boxNum} to do '-'`);
      if (map[boxNum]) {
        // Munge the array within if present
        const idxInBox = map[boxNum].reduce((priorVal, box, idx) => {
          if (box.name === partName) {
            // Found the box in the set
            return idx;
          }
          return priorVal;
        }, -1);
        output.push(`Found ${partName} in box ${boxNum} at index ${idxInBox}`);
        if (idxInBox !== -1) {
          map[boxNum].splice(idxInBox, 1);
        }
      } else {
        output.push(`That box doesn't exist, no-op`);
      }
    } else {
      output.push(`==== ==== ==== ==== ==== ==== ==== ERROR?! ${part}`);
    }

    output.push(`After ${part}:`);
    printMap();
    output.push('\n');
  }
  output.unshift(`Got Part 1 Sum: ${sum}`);

  // We're done sorting the boxes, now compute:
  let partTwoSum = 0;
  for (let boxNum = 0; boxNum < 256; boxNum++) {
    if (map[boxNum] && map[boxNum].length) {
      for (let idx = 0; idx < map[boxNum].length; idx++) {
        const box = map[boxNum][idx];
        const power = (boxNum + 1) * (idx + 1) * box.lens;
        partTwoSum += power;
        output.push(`${box.name}: ${boxNum+1} (box ${(''+boxNum).padStart(3, '0')}) * ${idx} (slot) * ${box.lens} = ${power}`)
      }
    }
  }
  output.unshift(`Part 2 Sum: ${partTwoSum}`);

  return json({ ok: true, rawInput, output: output.join('\n') });
}