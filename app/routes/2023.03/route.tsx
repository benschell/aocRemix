import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 3;
const slug = '2023.03';
const name = 'Day 03';

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
          <Textarea name="raw-input" placeholder="(optionally) provide raw input here" rows={4} />
        </div>
        <Button type="submit">Submit</Button>
      </Form>

      <div  className="flex max-w-4xl flex-col gap-4 mt-10">
        <h2>Output:</h2>
        <Textarea id="comment" value={actionData.output} readOnly rows={10} />
        <h3>From input:</h3>
        <Textarea id="comment" value={actionData.rawInput} readOnly rows={10} />
      </div>
    </div>
  );
}

const NUMS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const PERIOD = '.';
const GEAR = '*';

const lookForGear = (output: string[], lines: string[], lineNum: number, startingCharNum: number, numStrLength: number) => {
  // output.push(`Looking for symbol on ${lineNum} between ${startingCharNum-1} and ${startingCharNum+numStrLength+1} (vs 0 and ${lines.length})`);
  const gearCoordinates = [];
  if (lineNum >= 0 && lineNum < lines.length) {
    const line = lines[lineNum];
    // output.push(`Doing for: ${startingCharNum-1}, compare to ${numStrLength+2}`);
    for (let charNum = startingCharNum-1; charNum < startingCharNum-1+numStrLength+2; charNum++) {
      // output.push(`Char: ${charNum} (vs 0 and ${line.length})`);
      if (charNum >= 0 && charNum < line.length) {
        const char = line[charNum];
        // output.push(`Examining: ${charNum} -> ${line[charNum]}`);
        if (char === GEAR) {
          // This is a gear!
          // Return the coordinates
          gearCoordinates.push(`l${lineNum}c${charNum}`);
        }
      }
    }
    // output.push(`Line ${line} has symbol between ${startingCharNum-1} and ${startingCharNum+numStrLength+1}? false`);
  }
  // output.push(`Found gear coordinates: ${gearCoordinates}`);
  return gearCoordinates;
};

const lookForSymbol = (output: string[], lines: string[], lineNum: number, startingCharNum: number, numStrLength: number) => {
  // output.push(`Looking for symbol on ${lineNum} between ${startingCharNum-1} and ${startingCharNum+numStrLength+1} (vs 0 and ${lines.length})`);
  if (lineNum >= 0 && lineNum < lines.length) {
    const line = lines[lineNum];
    // output.push(`Doing for: ${startingCharNum-1}, compare to ${numStrLength+2}`);
    for (let charNum = startingCharNum-1; charNum < startingCharNum-1+numStrLength+2; charNum++) {
      // output.push(`Char: ${charNum} (vs 0 and ${line.length})`);
      if (charNum >= 0 && charNum < line.length) {
        const char = line[charNum];
        // output.push(`Examining: ${charNum} -> ${line[charNum]}`);
        if (char !== PERIOD && !NUMS.includes(char)) {
          // This is not a period nor a NUM
          // output.push(`Line ${line} has symbol between ${startingCharNum-1} and ${startingCharNum+numStrLength+1}? true`);
          return true;
        }
      }
    }
    // output.push(`Line ${line} has symbol between ${startingCharNum-1} and ${startingCharNum+numStrLength+1}? false`);
  }
  return false;
};

export async function action({
  request,
}: ActionFunctionArgs) {

  const __dirname = getDirname();

  const formData = await request.formData();
  const output: string[] = [];
  let rawInput = formData.get('raw-input') as string;
  if (!rawInput) {
    // Load the indicated file
    const inputFileName = formData.get('selected-input');

    // Read the json data file data.json
    rawInput = (await fs.readFile(`${__dirname}/../app/routes/${slug}/inputs/${inputFileName}`, "utf8")) as string;
  }

  const lines = rawInput.split('\n');

  // Let's try again
  // Find all the numbers
  let partNumTotal = 0;
  let gears: {[key: string]: number[]} = {};
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum].replace(/[^0-9]/g, '.');
    const nums = line.split('.');
    output.push(`Nums: ${nums.length}, ${nums} (from ${line})`);
    let currentCharIndex = 0;
    for (let idxToCheck = 0; idxToCheck < nums.length; idxToCheck++) {
      const unsanitizedNumStr = nums[idxToCheck];

      // output.push(`Found ${unsanitizedNumStr || '.'} at ${currentCharIndex} (${line.substring(currentCharIndex, currentCharIndex+(unsanitizedNumStr || '.').length)})`);
      let charNum = currentCharIndex;
      // output.push(`Incrementing ${currentCharIndex} + ${unsanitizedNumStr.length || 1} for ${unsanitizedNumStr || '.'}`);
      currentCharIndex += unsanitizedNumStr.length + 1 || 1;

      let numStr = unsanitizedNumStr;
      if (!NUMS.includes(numStr[0])) {
        // First char is a symbol
        numStr = numStr.substring(1);
        charNum += 1;
      }
      if (!NUMS.includes(numStr[numStr.length-1])) {
        // Last char is a symbol
        numStr = numStr.substring(0, numStr.length-1);
      }
      const num = parseInt(numStr);
      if (!isNaN(num)) {
        // output.push(`Got num: ${num} from ${numStr} at idx ${charNum} (and of length ${numStr.length})`);
        // Look around for a symbol
        const hasSymbolOnPriorLine = lookForSymbol(output, lines, lineNum-1, charNum, numStr.length);
        const hasSymbolOnNextLine = lookForSymbol(output, lines, lineNum+1, charNum, numStr.length);
        const leftIdx = charNum - 1;
        // output.push(`Examining to the left: ${charNum} - 1 = ${leftIdx} of ${lines[lineNum]} = (${lines[lineNum][leftIdx]})`);
        const hasSymbolToLeft = (leftIdx >= 0 && lines[lineNum][leftIdx] !== PERIOD && !NUMS.includes(lines[lineNum][leftIdx]));
        const rightIdx = charNum + numStr.length;
        // output.push(`Examining to the right: ${charNum} + ${numStr.length} = ${rightIdx} of ${lines[lineNum]} = ${lines[lineNum][rightIdx]}`);
        const hasSymbolToRight = (rightIdx < lines[lineNum].length && lines[lineNum][rightIdx] !== PERIOD && !NUMS.includes(lines[lineNum][rightIdx]));

        const hasSymbolInRange = hasSymbolOnPriorLine || hasSymbolOnNextLine || hasSymbolToLeft || hasSymbolToRight;
        output.push(`For ${num}, found symbol before (${hasSymbolOnPriorLine}), after (${hasSymbolOnNextLine}), left (${hasSymbolToLeft}), right (${hasSymbolToRight}) :: ${hasSymbolInRange}`)
        if (hasSymbolInRange) {
          partNumTotal += num;
        }

        const gearAboveCoordinates = lookForGear(output, lines, lineNum-1, charNum, numStr.length);
        const gearBelowCoordinates = lookForGear(output, lines, lineNum+1, charNum, numStr.length);
        const knownGears = gearAboveCoordinates.concat(gearBelowCoordinates);
        if (leftIdx >= 0 && lines[lineNum][leftIdx] === GEAR) {
          knownGears.push(`l${lineNum}c${leftIdx}`);
        }
        if (rightIdx < lines[lineNum].length && lines[lineNum][rightIdx] === GEAR) {
          knownGears.push(`l${lineNum}c${rightIdx}`);
        }
        for (const gearCoordinate of knownGears) {
          if (!gears[gearCoordinate]) {
            gears[gearCoordinate] = [];
          }
          gears[gearCoordinate].push(num);
        }
        output.push(`Found gears: ${knownGears} near ${num}`);
        output.push(`All Gears: ${JSON.stringify(gears)}`);
      }
    }
  }
  output.unshift(`Part 1: ${partNumTotal}`);
  // 526999 is too low
  // 513629 is too low
  // 527378 is too high
  // 527144 was Part 1 ans

  let gearSum = 0;
  for (const gearCoordinates in gears) {
    const numsNearGear = gears[gearCoordinates];
    if (numsNearGear && numsNearGear.length == 2) {
      output.push(`Found gear with 2 adjacent parts! ${JSON.stringify(numsNearGear)}`);
      let product = numsNearGear[0] * numsNearGear[1];
      gearSum += product;
    }
  }
  output.unshift(`Part 2: ${gearSum}`);
  // 81804557 is too high
  // 77908790 is too low
  // 81463996 was Part 2 ans

  return json({ ok: true, rawInput, output: output.join('\n') });
}