import { NextResponse } from 'next/server';

const inventory = [];

// Utility function to find item by ID
const findItemById = (id) => inventory.find((item) => item.id === id);

export async function GET(req) {
    return NextResponse.json(inventory);
}

export async function POST(req) {
    const newItem = await req.json();
    newItem.id = inventory.length + 1; // simple ID assignment
    inventory.push(newItem);
    return NextResponse.json(newItem, { status: 201 });
}

export async function PUT(req) {
    const updatedItem = await req.json();
    const index = inventory.findIndex((item) => item.id === updatedItem.id);
    if (index === -1) {
        return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    inventory[index] = updatedItem;
    return NextResponse.json(updatedItem);
}

export async function DELETE(req) {
    const { id } = await req.json();
    const index = inventory.findIndex((item) => item.id === id);
    if (index === -1) {
        return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }
    inventory.splice(index, 1);
    return NextResponse.json({ message: 'Item deleted' });
}