"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Create a VPC
const vpc = new aws.ec2.Vpc("my-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        Name: "my-vpc",
    },
});

// Create an Internet Gateway
const internetGateway = new aws.ec2.InternetGateway("my-igw", {
    vpcId: vpc.id,
    tags: {
        Name: "my-igw",
    },
});

// Create a Public Subnet
const publicSubnet = new aws.ec2.Subnet("public-subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "ap-southeast-1a", // Change this to your desired AZ
    mapPublicIpOnLaunch: true,
    tags: {
        Name: "public-subnet",
    },
});

// Create a Route Table
const routeTable = new aws.ec2.RouteTable("public-rt", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id,
        },
    ],
    tags: {
        Name: "public-rt",
    },
});

// Associate the Route Table with the Public Subnet
const routeTableAssociation = new aws.ec2.RouteTableAssociation("public-rta", {
    subnetId: publicSubnet.id,
    routeTableId: routeTable.id,
});

// Create a Security Group
const securityGroup = new aws.ec2.SecurityGroup("web-sg", {
    description: "Allow inbound HTTP and SSH traffic",
    vpcId: vpc.id,
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ["0.0.0.0/0"], // For better security, replace with your IP
        }
    ],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    tags: {
        Name: "web-sg",
    },
});

// Create a key pair
const keyPair = new aws.ec2.KeyPair("my-key-pair", {
    publicKey: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCt38K513EpIkSFkgcawcQ07k+x+H6nhObtRfT+/yTGOZp3ZTS2FcLMO3oz+yVGXUPzJIB50+Oz1OBD6FRSRyHi125x182qkR0sjTwJQAy92I7qUO+xAxuLh8vvbXxP/N5e/S4SG9nl6HzMhZmQ1950VCj0waykxbSVwouYfjOKUbLEO0zdrXF1OJFJ8eHyAiuOMvBLK3AhbOONnXPLxzZdjS0r/BX8EiRMCptlC30pcfdnX9g0cBwZSQAEOMVCkOaiqTQ0h4ZZJ1eReY1iVHj3ZAPf4bf/r0FLRMQsPmJrZhAd/NQoUZ4bRjUfPvxuxPcYG0uGGHSsH/vXYjDnSP8Z root@e07dd0a1035ec23a", // Replace with your public key
});

// Create two EC2 instances
const createEC2Instance = (name, az) => {
    return new aws.ec2.Instance(name, {
        instanceType: "t3.small",
        ami: "ami-01938df366ac2d954",  // Change with your ami ID
        subnetId: publicSubnet.id,
        associatePublicIpAddress: true,
        vpcSecurityGroupIds: [securityGroup.id],
        availabilityZone: az,
        keyName: keyPair.keyName,
        tags: {
            Name: name,
        },
    });
};

const instance1 = createEC2Instance("instance-1", "ap-southeast-1a");
const instance2 = createEC2Instance("instance-2", "ap-southeast-1a");

// Export the VPC ID and EC2 instance public IPs
exports.vpcId = vpc.id;
exports.instance1PublicIp = instance1.publicIp;
exports.instance2PublicIp = instance2.publicIp;