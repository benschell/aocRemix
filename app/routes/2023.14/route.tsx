import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Tooltip, Button, Dropdown, Navbar, Label, TextInput, Checkbox, Select, Textarea } from "flowbite-react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { Form, Link, useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { promises as fs } from "fs";
import { getDirname } from "~/util";

const dayNum = 14;
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

  const lines = rawInput.split('\n');
  // First index is x, second index is y
  const map: string[][] = [];
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    if (lines[lineIdx].length === 0) {
      continue;
    }

    for (let charIdx = 0; charIdx < lines[lineIdx].length; charIdx++) {
      if (!map[charIdx]) {
        map[charIdx] = [];
      }
      map[charIdx][lineIdx] = lines[lineIdx][charIdx];
    }
  }

  const printMap = () => {
    const lines = [];
    for (let x = 0; x < map.length; x++) {
      for (let y = 0; y < map[x].length; y++) {
        if (x === 0) {
          lines[y] = '';
        }
        lines[y] += map[x][y];
      }
    }
    output.push(`Map:\n${lines.join('\n')}`);
  }

  printMap();

  enum Direction {
    LEFT = 'left',
    RIGHT = 'right',
    UP = 'up',
    DOWN = 'down',
  };
  const tilt = (direction: Direction) => {
    // If up or down, iterate x then y
    // If left or right, iterate y then x
    if (direction === Direction.UP) {
      for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
          if (map[x][y] === 'O') {
            let nextRow = y-1;
            while (nextRow >= 0 && map[x][nextRow] === '.') {
              map[x][nextRow+1] = '.';
              map[x][nextRow] = 'O';
              nextRow -= 1;
            }
          }
        }
      }
    } else if (direction === Direction.DOWN) {
      for (let x = 0; x < map.length; x++) {
        for (let y = map[x].length-1; y >= 0; y--) {
          if (map[x][y] === 'O') {
            let nextRow = y+1;
            while (nextRow < map[x].length && map[x][nextRow] === '.') {
              map[x][nextRow-1] = '.';
              map[x][nextRow] = 'O';
              nextRow += 1;
            }
          }
        }
      }
    } else if (direction === Direction.LEFT) {
      for (let x = 0; x < map.length; x++) {
        for (let y = 0; y < map[x].length; y++) {
          if (map[x][y] === 'O') {
            let nextCol = x-1;
            while (nextCol >= 0 && map[nextCol][y] === '.') {
              map[nextCol+1][y] = '.';
              map[nextCol][y] = 'O';
              nextCol -= 1;
            }
          }
        }
      }
    } else if (direction === Direction.RIGHT) {
      for (let x = map.length-1; x >= 0; x--) {
        for (let y = 0; y < map[x].length; y++) {
          if (map[x][y] === 'O') {
            let nextCol = x+1;
            while (nextCol < map.length && map[nextCol][y] === '.') {
              map[nextCol-1][y] = '.';
              map[nextCol][y] = 'O';
              nextCol += 1;
            }
          }
        }
      }
    }
  }
  const computeSum = () => {
    let sum = 0;
    for (let x = 0; x < map.length; x++) {
      for (let y = 0; y < map[x].length; y++) {
        if (map[x][y] === 'O') {
          sum += map[x].length - y;
        }
      }
    }
    return sum;
  }
  // Part 1:
  let sum = -1;
  // tilt(Direction.UP);
  // Part 2: 
                           // For test
                           // 1000000 = 1s
                           // 10000000 = 10s
                           // 100000000 = 108s (1.8m)
                           // 1000000000 = 1064s (17m)
                           // For input
                           // 1000000 = 
                           // 10000000 = 
                           // 100000000 = 
                           // 1000000000 = 
  const sums: number[] = [];
  let loopSums: number[] = [];
  let check = 0;
  for (let cycle = 0; cycle < 300; cycle++) {
    tilt(Direction.UP);
    if (cycle === 0) {
      // Figure sum
      // We've finished updating this column, so add to the sum:
      sum = computeSum();
      output.push(`Part 1 map (after just UP):`);
      printMap();
    }
    tilt(Direction.LEFT);
    tilt(Direction.DOWN);
    tilt(Direction.RIGHT);
    // output.push(`\nAfter ${cycle+1} cycles:`);
    // printMap();
    const thisSum = computeSum();
    output.push(`For cycle ${cycle+1}, sum: ${thisSum}, index: ${sums.indexOf(computeSum()) + 1}`);
    sums.push(thisSum);
  }

  // Determine if there is a cycle in those sums
  // Floyd's Algorithm
  let tortoise = 3;
  let hare = 4;
  while (true) {
    tortoise += 1;
    hare += 2;
    if (
      sums[tortoise] === sums[hare] &&
      hare - tortoise > 2
    ) {
      break;
    }
  }
  output.unshift(`After first phase, tortoise: ${tortoise+1} (${sums[tortoise]}), hare: ${hare+1} (${sums[hare]})`);
  // This ^ is broken I think due to being based on linked-list (rather than array of unbounded length)

  // For my input, the loop starts after cycle #119
  // Then the values at #120-161 start to repeat
  // so, the value at n should be at this point in the cycle:
  // (n - 119) % (161-120)
  const n = 1000000000;
  const startOfCycle = 120;
  const endOfCycle = 161;
  const positionInCycle = (n-(startOfCycle-1)) % (endOfCycle - startOfCycle + 1);
  const valueAtThatPosition = sums[startOfCycle-1 + positionInCycle];
  output.unshift(`Position in Cycle? ${positionInCycle} :: ${valueAtThatPosition}`);
  // 102048 is too low
  // 102055 (one position earlier) was right 


  output.unshift(`Part 1 Sum: ${sum}`);

  return json({ ok: true, rawInput, output: output.join('\n') });
}