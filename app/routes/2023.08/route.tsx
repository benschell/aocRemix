import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";
// import { spawn, Thread, Worker } from "threads";

const dayNum = 8;
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
  const directions = lines[0];
  const instrs = lines.slice(2);

  // Part 1:
  // Build an index
  const map: {[key: string]: { left: string, right: string, name: string, isZ: boolean }} = {};
  const as: string[] = [];
  const zs: string[] = [];
  instrs.forEach(instr => {
    if (instr.length === 0) {
      return;
    }

    const instrParts = instr.split(' ');
    const name = instrParts[0];
    const lastChar = name[name.length-1];
    const left = instrParts[2].substring(1, 4);
    const right = instrParts[3].substring(0, 3);
    map[name] = { left, right, name, isZ: lastChar === 'Z' };

    if (lastChar === 'A') {
      as.push(name);
    } else if (lastChar === 'Z') {
      zs.push(name);
    }
  });

  output.push(`Will Travel via ${directions}`);
  // output.push(`Built map? ${JSON.stringify(map)}`);

  // let directionIdx = -1;
  // let found = false;
  // let current = 'AAA';
  // let numSteps = 0;
  // while (!found) {
  //   directionIdx += 1;
  //   if (directionIdx >= directions.length) {
  //     directionIdx = 0;
  //   }

  //   const next = map[current];
  //   if (directions[directionIdx] === 'R') {
  //     current = next.right;
  //   } else if (directions[directionIdx] === 'L') {
  //     current = next.left;
  //   } else {
  //     console.log('SOME OTHER DIRECTION?!', directionIdx, directions[directionIdx]);
  //     break;
  //   }
  //   output.push(`${directions[directionIdx]} from (${next.left}, ${next.right}) is ${current}`);

  //   numSteps++;
  //   if (current === 'ZZZ') {
  //     found = true;
  //     break;
  //   }

  // }

  // Part 2:
  // type TreeNode = {
  //   leftStr: string;
  //   left?: TreeNode;
  //   rightStr: string;
  //   right?: TreeNode;
  //   isZ: boolean;
  // };
  // const nodes: {[key: string]: TreeNode} = {};
  // const treeRoots: {[key: string]: TreeNode} = {};
  // const zs: string[] = [];
  // instrs.forEach(instr => {
  //   if (instr.length === 0) {
  //     return;
  //   }

  //   const instrParts = instr.split(' ');
  //   const from = instrParts[0];
  //   const lastChar = from[from.length-1];
  //   const leftStr = instrParts[2].substring(1, 4);
  //   const rightStr = instrParts[3].substring(0, 3);
  //   const treeNode = { leftStr, rightStr, isZ: lastChar === 'Z'};
  //   nodes[from] = treeNode;

  //   if (lastChar === 'A') {
  //     treeRoots[from] = treeNode;
  //   }
  // });

  // let directionIdx = -1;
  // let found = false;
  // let currentLocations = Object.values(treeRoots).slice(0, 1);
  // let numSteps = 0;

  // // For each tree root, find the number of steps to reach a Z
  // let treeRoot = currentLocations[0];
  // const zSteps = [];
  // const stepLimit = 1000;
  // while (true) {
  //   directionIdx += 1;
  //   if (directionIdx >= directions.length) {
  //     // console.log('REPEATING DIRECTIONS', directionIdx, directions.length);
  //     directionIdx = 0;
  //   }

  //   if (directions[directionIdx] === 'R') {
  //     treeRoot = nodes[treeRoot.rightStr];
  //   } else if (directions[directionIdx] === 'L') {
  //     treeRoot = nodes[treeRoot.leftStr];
  //   }
    
  //   if (treeRoot.isZ) {
  //     console.log(`Found a Z at ${numSteps}`);
  //     zSteps.push(numSteps);
  //   }

  //   if (numSteps++ > stepLimit) {
  //     break;
  //   }
  // }
  // console.log(`Over ${numSteps}, found these Zs: ${zSteps}`);

  // const auth = await spawn(new Worker(`${__dirname}/../app/routes/${slug}/worker`));


  let directionIdx = -1;
  let found = false;
  const zsEncountered: number[][] = [];

  let currentArr = as;
  let numSteps = 0;
  const stepLimit = 10000000000;
  while (!found) {
    directionIdx += 1;
    if (directionIdx >= directions.length) {
      // console.log('REPEATING DIRECTIONS', directionIdx, directions.length);
      directionIdx = 0;
    }
    // output.push(`Direction #${directionIdx} of ${directions.length} == ${directions[directionIdx]}!`);
    // output.push(`Current: ${JSON.stringify(currentArr)}`);

    // Iterate over all the current positions and move them appropriately
    let encounteredEnoughZs = 0;
    for (let currentIdx = 0; currentIdx < currentArr.length; currentIdx++) {
      const current = currentArr[currentIdx];
      // output.push(`At: ${current}`);
      const next = map[current];
      if (directions[directionIdx] === 'R') {
        currentArr[currentIdx] = next.right;
      } else if (directions[directionIdx] === 'L') {
        currentArr[currentIdx] = next.left;
      }

      if (next.isZ) {
        if (!zsEncountered[currentIdx]) {
          zsEncountered[currentIdx] = [];
        }
        if (zsEncountered[currentIdx].length < 2) {
          zsEncountered[currentIdx].push(numSteps);
          console.log(`pointer ${currentIdx} encountered Z #${zsEncountered[currentIdx].length}: ${next.name} at ${numSteps}`);
        }
      }
      if (zsEncountered[currentIdx] && zsEncountered[currentIdx].length >= 2) {
        encounteredEnoughZs += 1;
      }

      // output.push(`${directions[directionIdx]} from (${next.left}, ${next.right}) is ${currentArr[currentIdx]}`);
    }
    // output.push(`Now: ${JSON.stringify(currentArr)} ;; incrementing numSteps (currently ${numSteps})`);

    if (encounteredEnoughZs == currentArr.length) {
      // We've gotten 10 zs from each cycle
      console.log(`Encountered enough zs! ${encounteredEnoughZs}`);
      console.log(`Zs: ${JSON.stringify(zsEncountered, null, '\t')}`);
      break;
    }

    numSteps++;
    // // console.log(`Finding if we're at all Zs?`);
    // // console.log(`currentArr.filter: ${JSON.stringify(currentArr.filter((current) => zs.includes(current)).length)} vs. ${currentArr.length}`);
    // const atAllZs = currentArr.filter((current) => zs.includes(current)).length === currentArr.length;
    // // console.log(`Got atAllZs? ${atAllZs}`);
    // // console.log(`At all Zs? ${atAllZs} (from ${currentArr.filter((current) => zs.includes(current)).length} vs. ${currentArr.length})`)
    // if (atAllZs) {
    //   found = true;
    //   break;
    // }

  }
  const cycles = zsEncountered.map((zs) => zs[0]);
  // Lowest Common Multiple of each of these
  const workingCycles = cycles.slice();
  while (true) {
    // Compare all the values in workingCycles
    const firstCycle = workingCycles[0];
    const hasDifferences = !!workingCycles.filter((cycle) => cycle !== firstCycle).length;
    // console.log(`Has difference? ${hasDifferences}`);

    if (!hasDifferences) {
      // We're done!
      break;
    }

    const lowestNumber = workingCycles.reduce((acc, cycle, idx) => {
      if (cycle < acc.val) {
        return {idx, val: cycle};
      }
      return acc;
    }, {idx: -1, val: Number.MAX_SAFE_INTEGER})
    // console.log(`Lowest number of ${workingCycles} is ${lowestNumber.val}@${lowestNumber.idx}`);

    // Add the original value of that position 
    workingCycles[lowestNumber.idx] += cycles[lowestNumber.idx];
    // Jason's:            21083806112641
    if (workingCycles[0] > 30000000000000) {
      break;
    }
  }
  console.log(`Done? ${JSON.stringify(workingCycles)}`);

  output.unshift(`Got AAA -> ZZZ in ${numSteps} steps`);

  return json({ ok: true, rawInput, output: output.join('\n') });
}